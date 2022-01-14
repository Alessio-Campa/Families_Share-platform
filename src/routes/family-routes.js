const express = require('express')
const config = require('config')
const router = new express.Router()
const { google } = require('googleapis')
const googleEmail = config.get('google.email')
const googleKey = config.get('google.key')
const uh = require('../helper-functions/user-helpers')
const scopes = 'https://www.googleapis.com/auth/calendar'
const jwt = new google.auth.JWT(
  process.env[googleEmail],
  null,
  process.env[googleKey].replace(/\\n/g, '\n'),
  scopes
)
// const nodemailer = require('nodemailer')
const calendar = google.calendar({
  version: 'v3',
  auth: jwt
})
const Family = require('../models/family')
const Child = require('../models/child')
const Profile = require('../models/profile')
const Member = require('../models/member')
const Group = require('../models/group')
const Parent = require('../models/parent')

/*
const transporter = nodemailer.createTransport({ // per inviare email
  service: 'gmail',
  auth: {
    user: process.env.SERVER_MAIL,
    pass: process.env.SERVER_MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
}) */


/**
 * @api {get} /api/family/ get a family
 *    requires to be a member of the family
 * @apiName GetFamily
 * @apiGroup Family
 * 
 * @apiParam {familyID} the id of the family you want to get
 */
router.get('/:familyId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const family = await Family.findById(req.params.familyId)
    if (!family) {
      return res.status(500).send('This family does not exist')
    }
    family.members.forEach(element => {
      if(element._id === req.user_id) {
        return res.status(200).json(family)
      }
    });
  } catch (e) {
    next(e)
  }
})

/** valutare se spostare sulle routes dello user
 * @api {get} /api/family/:userId get all the families of a user
 * @apiName GetUserFamilies
 * @apiGroup Family
 *
 * @apiParam {userId} the user id
 * @apiSuccess {Families} the id's of the user's families
 */
router.get('/user/:userId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated')}
  try {
    if (req.user_id !== req.params.userId) {return res.status(403).send('forbidden')}
    Family.find({
      'members._id': req.user_id
    }).select('_id').then(data => {
      res.status(200).json(data)
    })
  } catch (err) {
    next(err)
  }
})

/**
 * @api {get} /api/family/:familyId/events get all the events of a family
 * @apiName GetUserFamilies
 * @apiGroup Family
 *
 * @apiParam {familyId} the id of the family
 */
router.get('/:familyId/events', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated')}
  try {
    Family.findOne({$and: [{
      'members._id': req.user_id
    },{
      '_id': req.params.familyId
    }]
  }).then(family => {
    if (!family) return res.status(404).send('family does not exist');
    async function getUserEvents(user_id) {
      const usersGroups = await Member.find({ user_id, user_accepted: true, group_accepted: true })
      const groups = await Group.find({ group_id: { $in: usersGroups.map(group => group.group_id) } })
      const children = await Parent.find({ parent_id: user_id })
      const childIds = children.map(parent => parent.child_id)
      // const test = (family.members.filter(member => member.role === 'child')).map(member => member.id)
      const responses = await Promise.all(groups.map(group => uh.getUsersGroupEvents(group.calendar_id, user_id, childIds)))
      const events = [].concat(...responses)
      return events
    }
    async function getAllUsersEvents(users) {
      let allEvents = []
      for (let user of users) {
        events = await getUserEvents(user._id)
        allEvents = allEvents.concat(events)
      }
      return allEvents
    }
    getAllUsersEvents(family.members).then(familyEvents => {
      let uniqueEventsIds = [];
      let uniqueEvents = [];
      familyEvents.forEach((event) => {
        if (!uniqueEventsIds.includes(event.id)) {
          uniqueEventsIds.push(event.id);
          uniqueEvents.push(event);
        }
      });
      return res.status(200).json(uniqueEvents)
    })
  }).catch(err => console.log(err))
  } catch (err) {
    next(err)
  }
})

/**
 * @api {post} /api/family/ create a new family
 *    requires to be authenticated
 * @apiName CreateFamily
 * @apiGroup Family
 *
 * @apiBody {familyName} the name of the family
 * @apiBody {role} the role of the user
 *
 */
router.post('/', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    if (!req.body.familyName) { return res.status(400).send('Bad request') }

    const members = [{_id: req.user_id, role: req.body.role}]
    const familyName = req.body.familyName
    const familyCalendar = {
      summary: familyName + '-familyCalendar'
    }
    const response = await calendar.calendars.insert({ resource: familyCalendar })
    const newFamily = new Family({
      name: familyName,
      members: members,
      calendar_id: response.data.id
    })
    await newFamily.save(err => {
      if (err) return next(err)
    })
    res.status(200).json(newFamily)
  } catch (err) {
    next(err)
  }
})

/**
 * @api {put} /api/family/:familyId add someone to a family
 *    requires to be a member of the family
 * @apiName AddFamilyMember
 * @apiGroup Family
 *
 * @apiParam {familyId} family id
 *
 * @apiBody {memberId} new member id
 * @apiBody {role} role of the new member
 * @apiBody {isCreator} if the user is the creator of the family and thus already accepted
 */
router.put('/:familyId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    const familyId = req.params.familyId;
    const memberId = req.body.memberId;
    const role = req.body.role;

    let new_member = {_id: memberId, role: role}
    
    let existence = new Promise((resolve,reject) => {
      if (role === 'child') {
        Child.exists({child_id: memberId}, (err, result) => {
          resolve(result)
        })
      }
      else {
        Profile.exists({user_id: memberId}, (err, result) => {
          resolve(result)
        })
      }
    })
    
    existence.then((result) => {
      if (!result) {return res.status(500).send('The user or child does not exist')}
      Family.findOne({$and: [{
        'members._id': req.user_id
      },{
        '_id': familyId
      }]
    }).then(family => {
      if (!family) {return res.status(404).send('Family does not exist')}
      if (family.members.filter(element => element._id === memberId).length > 0) {
        return res.status(500).send('User already in the family')
      }
      family.members.push(new_member)
      family.save().then(() => {
        return res.status(200).send('Family updated correctly')
      }).catch (err => console.log(err))
    }).catch(err => console.log(err))
    })
  } catch (e) {
    next(e)
  }
})

router.patch('/:familyId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  let updatedMembers = req.body.members;

  Family.findOne({_id: req.params.familyId}).then(family =>{
    let is_member = false;
    family.members.forEach(m =>{
      if (m._id === req.user_id)
        is_member = true;
    })
    if(!is_member)
      return res.status(403).send("Unauthorized")

    family.members = []
    updatedMembers.forEach(m => {
      family.members.push({_id: m._id, role: m.role})
    })
    family.save().then(()=>{
      return res.status(200).send("Family updated correctly")
    }).catch(err => {
      return res.status(500).send(err)
    })

  }).catch(err => {
    return res.status(404).send(err)
  })

})

/**
 * @api {delete} /api/family/:familyId/member/:memberId delete a family member
 * 
 * @apiName DeleteFamilyMember
 * @apiGroup Family
 * 
 * @apiParam {familyId} id of the family
 * @apiParam {membersId} id of the member to delete
 *
 */
router.delete('/:familyId/member/:memberId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    const familyId = req.params.familyId;
    const memberId = req.params.memberId;
    Family.findOne({$and: [{
      'members._id': req.user_id
    },{
      '_id': familyId
    }]
  }).then(family => {
    if (!family) {return res.status(404).send('Family does not exist')}
    if (family.members.filter(element => element.role !== 'child').length === 1) {
      Family.deleteOne({'_id': familyId}).then(() => {
        return res.status(200).send('The entire family has been deleted')
      })
    }
    else{
      family.members = family.members.filter(element => element._id !== memberId)
      family.save().then(() => {
        return res.status(200).send('Family updated correctly')
      })
    }

  }).catch(err => console.log(err))
  } catch (err) {
    next(err)
  }
})

module.exports = router
