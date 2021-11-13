const express = require('express')
const config = require('config')
const router = new express.Router()
const { google } = require('googleapis')
const googleEmail = config.get('google.email')
const googleKey = config.get('google.key')
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
    if (!req.body.role) {req.body.role = 'adult'}
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
    res.status(200).send('Family created')
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
 */
router.put('/:familyId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    const familyId = req.params.familyId
    const memberId = req.body.memberId
    const role = req.body.role    
    if (!role) {role = 'adult'} // adult is default role
    let new_member = {_id: memberId,role: role}
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
          if (!family) {return res.status(500).send('Family does not exist')}
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

module.exports = router
