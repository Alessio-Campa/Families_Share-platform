const express = require('express')
const config = require('config')
const router = new express.Router()
const multer = require('multer')
const objectid = require('objectid')
const fr = require('find-remove')
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
const path = require('path')
const sharp = require('sharp')
const nodemailer = require('nodemailer')
const texts = require('../constants/notification-texts')
const exportActivity = require('../helper-functions/export-activity-data')
const groupAgenda = require('../helper-functions/group-agenda')
const groupContacts = require('../helper-functions/group-contacts')
const nh = require('../helper-functions/notification-helpers')
const ah = require('../helper-functions/activity-helpers')
const ph = require('../helper-functions/plan-helpers')
const uh = require('../helper-functions/user-helpers')
const schedule = require('node-schedule')
const AsyncLock = require('async-lock');

if (process.env.NODE_APP_INSTANCE === 0) {
  schedule.scheduleJob(process.env.CRONJOB, () => {
    ah.checkCompletedTimeslots()
  })
}

const calendar = google.calendar({
  version: 'v3',
  auth: jwt
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SERVER_MAIL,
    pass: process.env.SERVER_MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
})

const groupStorage = multer.diskStorage({
  destination (req, file, cb) {
    cb(null, path.join(__dirname, '../../images/groups'))
  },
  filename (req, file, cb) {
    const fileName = `${req.params.id}-${Date.now()}.${file.mimetype.slice(
      file.mimetype.indexOf('/') + 1,
      file.mimetype.length
    )}`
    fr(path.join(__dirname, '../../images/groups'), { prefix: req.params.id })
    cb(null, fileName)
  }
})
const groupUpload = multer({
  storage: groupStorage,
  limits: { fieldSize: 52428800 }
})

const announcementStorage = multer.diskStorage({
  destination (req, file, cb) {
    cb(null, path.join(__dirname, '../../images/announcements'))
  },
  filename (req, file, cb) {
    if (req.params.announcement_id === undefined) {
      req.params.announcement_id = objectid()
    }
    cb(
      null,
      `${req.params.announcement_id}-${Date.now()}.${file.mimetype.slice(
        file.mimetype.indexOf('/') + 1,
        file.mimetype.length
      )}`
    )
  }
})
const announcementUpload = multer({
  storage: announcementStorage,
  limits: { fieldSize: 52428800 }
})

const Image = require('../models/image')
const Reply = require('../models/reply')
const Group_Settings = require('../models/group-settings')
const Member = require('../models/member')
const Group = require('../models/group')
const Plan = require('../models/plan')
const Notification = require('../models/notification')
const Announcement = require('../models/announcement')
const Parent = require('../models/parent')
const Activity = require('../models/activity')
const Child = require('../models/child')
const Profile = require('../models/profile')
const Community = require('../models/community')
const User = require('../models/user')
const TimeslotCarRides = require('../models/timeslotCarRides')
const { now } = require('moment')
const Survey = require('../models/survey')

router.get('/', (req, res, next) => {
  if (!req.user_id) return res.status(401).send('Not authenticated')
  const { query } = req
  if (query.searchBy === undefined) {
    return res.status(400).send('Bad Request')
  }
  switch (query.searchBy) {
    case 'visibility':
      Group_Settings.find({ visible: query.visible })
        .then(visibleGroups => {
          if (visibleGroups.length === 0) {
            return res.status(404).send('No visible groups were found')
          }
          const groupIds = []
          visibleGroups.forEach(group => groupIds.push(group.group_id))
          return Group.find({ group_id: { $in: groupIds } })
            .populate('image')
            .collation({ locale: 'en' })
            .sort({ name: 1 })
            .then(groups => {
              if (groups.length === 0) {
                return res.status(400).send('No groups were found')
              }
              return res.json(groups)
            })
        })
        .catch(next)
      break
    case 'ids':
      const groupIds = req.query.ids
      Group.find({ group_id: { $in: groupIds } })
        .populate('image')
        .lean()
        .exec()
        .then(groups => {
          if (groups.length === 0) {
            return res.status(404).send('No groups were found')
          }
          return res.json(groups)
        })
        .catch(next)
      break
    case 'all':
      Group.find({})
        .select('name')
        .then(groups => {
          if (groups.length === 0) {
            return res.status(404).send('No groups were found')
          }
          return res.json(groups)
        })
        .catch(next)
      break
    default:
      res.status(400).send('Bad Request')
  }
})

router.post('/', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const {
    invite_ids,
    description,
    location,
    name,
    visible,
    owner_id,
    contact_type,
    contact_info
  } = req.body
  if (
    !(
      invite_ids &&
      description &&
      location &&
      name &&
      contact_type &&
      visible !== undefined &&
      owner_id
    )
  ) {
    return res.sendStatus(400)
  }
  const group_id = objectid()
  const image_id = objectid()
  const settings_id = objectid()
  const newCal = {
    summary: name,
    description,
    location
  }
  const group = {
    group_id,
    name,
    description,
    background: '#00838F',
    location,
    owner_id,
    contact_type,
    settings_id,
    image_id
  }
  if (contact_type !== 'none') {
    group.contact_info = contact_info
  }
  const image = {
    image_id,
    owner_type: 'group',
    owner_id: group_id,
    path: '/images/groups/group_default_photo.png',
    thumbnail_path: '/images/groups/group_default_photo.png'
  }
  const settings = {
    settings_id,
    group_id,
    visible,
    open: true
  }
  const members = [
    {
      group_id,
      user_id: owner_id,
      admin: true,
      group_accepted: true,
      user_accepted: true
    }
  ]
  invite_ids.forEach(invite_id => {
    members.push({
      group_id,
      user_id: invite_id,
      admin: false,
      group_accepted: true,
      user_accepted: false
    })
  })
  try {
    const response = await calendar.calendars.insert({ resource: newCal })
    group.calendar_id = response.data.id
    await Member.create(members)
    await Group.create(group)
    await Image.create(image)
    await Group_Settings.create(settings)
    res.status(200).send('Group Created')
  } catch (err) {
    next(err)
  }
})

router.get('/suggestions', (req, res, next) => {
  Group_Settings.find({ visible: true })
    .then(groups => {
      if (groups.length === 0) {
        return res.status(404).send('No suggestions were found')
      }
      const noOfSuggestions = groups.length > 2 ? 3 : groups.length
      const suggestions = []
      for (let i = groups.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = groups[i]
        groups[i] = groups[j]
        groups[j] = temp
      }
      for (let i = 0; i < noOfSuggestions; i++) {
        suggestions.push(groups[i].group_id)
      }
      res.json(suggestions)
    })
    .catch(next)
})

router.get('/:id', (req, res, next) => {
  const { id } = req.params
  Group.findOne({ group_id: id })
    .populate('image')
    .lean()
    .exec()
    .then(group => {
      if (!group) {
        return res.status(404).send('Group not found')
      }
      res.json(group)
    })
    .catch(next)
})

router.delete('/:id', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { id } = req.params
  const editingUser = await Member.findOne({
    group_id: req.params.id,
    user_id: req.user_id,
    group_accepted: true,
    user_accepted: true
  })
  if (!editingUser) {
    return res.status(401).send('Unauthorized')
  }
  if (!editingUser.admin) {
    return res.status(401).send('Unauthorized')
  }
  try {
    const group = await Group.findOneAndDelete({ group_id: id })
    await calendar.calendars.delete({ calendarId: group.calendar_id })
    await Member.deleteMany({ group_id: id })
    await Group_Settings.deleteOne({ group_id: id })
    await Image.deleteMany({ owner_type: 'group', owner_id: id })
    res.status(200).send('Group was deleted')
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', groupUpload.single('photo'), async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { file } = req
  const { id } = req.params
  const { visible, name, description, location, background, contact_type, contact_info } = req.body
  if (
    !(visible !== undefined && name && description && location && background && contact_type)
  ) {
    return res.status(400).send('Bad Request')
  }
  const settingsPatch = { visible }
  const groupPatch = {
    name,
    description,
    background,
    location,
    contact_type
  }
  if (contact_type !== 'none') {
    groupPatch.contact_info = contact_info
  }
  try {
    const editingUser = await Member.findOne({
      group_id: req.params.id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!editingUser) {
      return res.status(401).send('Unauthorized')
    }
    if (!editingUser.admin) {
      return res.status(401).send('Unauthorized')
    }
    await nh.editGroupNotification(id, req.user_id, {
      ...groupPatch,
      visible,
      file
    })
    await Group.updateOne({ group_id: id }, groupPatch)
    await Group_Settings.updateOne({ group_id: id }, settingsPatch)
    if (file) {
      const fileName = file.filename.split('.')
      const imagePatch = {
        path: `/images/groups/${file.filename}`,
        thumbnail_path: `/images/groups/${fileName[0]}_t.${fileName[1]}`
      }
      await sharp(path.join(__dirname, `../../images/groups/${file.filename}`))
        .resize({
          height: 200,
          fit: sharp.fit.cover
        })
        .toFile(
          path.join(
            __dirname,
            `../../images/groups/${fileName[0]}_t.${fileName[1]}`
          )
        )
      await Image.updateOne({ owner_type: 'group', owner_id: id }, imagePatch)
    }
    res.status(200).send('Group Updated')
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/settings', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { id } = req.params
  const settingsPatch = req.body
  try {
    const editingUser = await Member.findOne({
      group_id: req.params.id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!editingUser) {
      return res.status(401).send('Unauthorized')
    }
    if (!editingUser.admin) {
      return res.status(401).send('Unauthorized')
    }
    await Group_Settings.updateOne({ group_id: id }, settingsPatch)
    res.status(200).send('Settings Updated')
  } catch (error) {
    next(error)
  }
})

router.get('/:id/settings', (req, res, next) => {
  const { id } = req.params
  Group_Settings.findOne({ group_id: id })
    .then(settings => {
      if (!settings) {
        return res.status(404).send('Group Settings not found')
      }
      res.json(settings)
    })
    .catch(next)
})

router.get('/:id/members', async (req, res, next) => {
  const { id } = req.params
  let projection = {}
  const user = await Member.findOne({
    group_id: id,
    user_id: req.user_id,
    group_accepted: true,
    user_accepted: true
  })
  if(!req.user_id || !user || !user.admin)
  {
    //Information available only to admin
    projection['reports'] = 0;
  }

  Member.find({ group_id: id }, projection)
    .then(members => {
      if (members.length === 0) {
        return res.status(404).send('Group has no members')
      }

      //You cannot see reports against you
      members = members.map(m => {
        if(m.user_id === req.user_id)
          m.reports = undefined
        return m
      })

      res.send(members)
    })
    .catch(next)
})

router.get('/:id/children', async (req, res, next) => {
  const { id } = req.params
  const members = await Member.find({ group_id: id, user_accepted: true, group_accepted: true }).distinct('user_id')
  const children = await Parent.find({ parent_id: { $in: members } }).distinct('child_id')
  if (children.length === 0) {
    return res.status(404).send('Group has no children')
  }
  return res.json([...new Set(children)])
})

router.patch('/:id/members', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const group_id = req.params.id
    const patch = req.body.patch
    const user_id = req.body.id
    const editingUser = await Member.findOne({
      group_id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!editingUser) {
      return res.status(401).send('Unauthorized')
    }
    if (!editingUser.admin) {
      return res.status(401).send('Unauthorized')
    }
    if (!(patch.group_accepted !== undefined || patch.admin !== undefined)) {
      return res.status(400).send('Bad Request')
    }
    let community = await Community.findOne({})
    if (!community) {
      community = await Community.create({})
    }
    if (patch.group_accepted !== undefined) {
      patch.admin = community.auto_admin
    }
    await Member.updateOne({ group_id, user_id }, patch)
    let message = ''
    if (patch.group_accepted !== undefined) {
      if (patch.group_accepted) {
        nh.newMemberNotification(group_id, user_id)
        message = 'Request confirmed'
      } else {
        message = 'Request deleted'
      }
    } else if (patch.admin) {
      message = 'Admin added'
    } else {
      message = 'Admin removed'
    }
    res.status(200).send(message)
  } catch (err) { next(err) }
})

router.delete('/:groupId/members/:memberId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.groupId
  const user_id = req.user_id
  const member_id = req.params.memberId
  const editingUser = await Member.findOne({
    group_id,
    user_id,
    group_accepted: true,
    user_accepted: true
  })
  if (!editingUser) {
    return res.status(401).send('Unauthorized')
  }
  if (!editingUser.admin) {
    return res.status(401).send('Unauthorized')
  }
  try {
    const children = await Parent.find({ parent_id: member_id })
    const usersChildrenIds = children.map(child => child.child_id)
    const group = await Group.findOne({ group_id })
    let events = await ah.fetchAllGroupEvents(group.group_id, group.calendar_id)
    events = events.filter(e => e.extendedProperties.shared.status === 'ongoing')
    const patchedEvents = []
    events.forEach(event => {
      let patched = false
      const parentIds = JSON.parse(event.extendedProperties.shared.parents)
      if (parentIds.includes(member_id)) {
        patched = true
        event.extendedProperties.shared.parents = JSON.stringify(
          parentIds.filter(id => id !== member_id)
        )
      }
      const childrenIds = JSON.parse(event.extendedProperties.shared.children)
      if (childrenIds.filter(c => usersChildrenIds.includes(c)).length) {
        patched = true
        event.extendedProperties.shared.children = JSON.stringify(
          childrenIds.filter(id => usersChildrenIds.indexOf(id) === -1)
        )
      }
      if (patched) patchedEvents.push(event)
    })
    await patchedEvents.reduce(async (previous, event) => {
      await previous
      const timeslotPatch = {
        extendedProperties: {
          shared: {
            parents: event.extendedProperties.shared.parents,
            children: event.extendedProperties.shared.children
          }
        }
      }
      return calendar.events.patch({
        calendarId: group.calendar_id,
        eventId: event.id,
        resource: timeslotPatch
      })
    }, Promise.resolve())

    await Member.deleteOne({ group_id, user_id: member_id })
    await nh.removeMemberNotification(member_id, group_id)
    res.status(200).send('User removed from group')
  } catch (error) {
    next(error)
  }
})

router.post('/:id/members', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const userIds = req.body.inviteIds
  try {
    const editingUser = await Member.findOne({
      group_id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!editingUser) {
      return res.status(401).send('Not authenticated')
    }
    if (!editingUser.admin) {
      return res.status(401).send('Not authenticated')
    }
    if (!userIds) {
      return res.status(400).send('Bad Request')
    }
    const members = await Member.find({ group_id, user_id: { $in: userIds } })
    for (const member of members) {
      userIds.splice(userIds.indexOf(member.used_id), 1)
      if (!member.group_accepted) {
        member.group_accepted = true
        await member.save()
      }
    }
    await Member.create(
      userIds.map(id => ({
        user_id: id,
        group_id,
        admin: false,
        group_accepted: true,
        user_accepted: false
      }))
    )
    res.status(200).send('Members invited')
  } catch (error) {
    next(error)
  }
})

router.get('/:id/notifications', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { id } = req.params
  try {
    const member = await Member.findOne({
      group_id: id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const user = await User.findOne({ user_id: req.user_id })
    const notifications = await Notification.find({
      owner_type: 'group',
      owner_id: id
    })
      .lean()
      .exec()
    if (notifications.length === 0) {
      return res.status(404).send('Group has no notifications')
    }
    notifications.forEach(notification => {
      notification.header =
        texts[user.language][notification.type][notification.code].header
      notification.description = nh.getNotificationDescription(
        notification,
        user.language
      )
    })
    res.json(notifications)
  } catch (error) {
    next(error)
  }
})

router.get('/:id/events', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const user_id = req.user_id
  try {
    const group = await Group.findOne({ group_id })
    if (!group) {
      return res.status(404).send('Non existing group')
    }
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const events = await ah.fetchAllGroupEvents(group.group_id, group.calendar_id)
    if (events.length === 0) {
      return res.status(404).send('Group has no events')
    }
    res.json(events)
  } catch (error) {
    next(error)
  }
})

router.get('/:id/metrics', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const user_id = req.user_id
  const group_id = req.params.id
  try {
    const members = await Member.find({
      group_id,
      group_accepted: true,
      user_accepted: true
    }).lean()
    const member = members.find(m => m.user_id === user_id)
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    const profiles = await Profile.find({ user_id: { $in: members.map(m => m.user_id) } }).lean()
    const children = await Parent.find({ parent_id: { $in: members.map(m => m.user_id) } }).lean()
    const group = await Group.findOne({ group_id })
    const events = await ah.fetchAllGroupEvents(group.group_id, group.calendar_id)
    const totalVolunteers = members.length
    const totalKids = [...new Set(children.map(c => c.child_id))].length
    const totalEvents = events.length
    const contributions = profiles.map(p => ({ contribution: 0, user_id: p.user_id, given_name: p.given_name, family_name: p.family_name }))
    const completedEvents = events.filter(e => e.extendedProperties.shared.status === 'completed')
    const totalCompletedEvents = completedEvents.length
    completedEvents.forEach(event => {
      const participants = JSON.parse(event.extendedProperties.shared.parents)
      participants.forEach(participant => {
        const contributor = contributions.find(c => c.user_id === participant)
        if (contributor) {
          contributor.contribution += 1
        }
      })
    })
    res.json({
      totalVolunteers,
      totalKids,
      totalEvents,
      contributions,
      totalCompletedEvents
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/contacts/export', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const user_id = req.user_id
  try {
    const group = await Group.findOne({ group_id })
    if (!group) {
      return res.status(404).send('Non existing group')
    }
    const members = await Member.find({ group_id, user_accepted: true, group_accepted: true })
    const member = members.find(member => member.user_id === user_id)
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const profiles = await Profile.find({ user_id: { $in: members.map(m => m.user_id) } })
    profiles.forEach(profile => {
      if (members.find(m => m.user_id === profile.user_id).admin) {
        profile.admin = true
      } else {
        profile.admin = false
      }
    })
    groupContacts.createExcel(group, profiles, () => {
      const mailOptions = {
        from: process.env.SERVER_MAIL,
        to: req.email,
        subject: `${group.name} group contacts`,
        html: groupAgenda.newGroupAgendaEmail(group.name),
        attachments: [
          {
            filename: `contacts.xlsx`,
            path: path.join(__dirname, `../../contacts.xlsx`)
          }
        ]
      }
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) next(err)
        fr('../', { files: `contacts.xlsx` })
      })
      res.status(200).send('Group contacts exported')
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/agenda/export', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const user_id = req.user_id
  try {
    const group = await Group.findOne({ group_id })
    if (!group) {
      return res.status(404).send('Non existing group')
    }
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const activities = await Activity.find({ group_id })
    if (activities.length === 0) {
      return res.status(404).send('Group has no agenda')
    }
    let events = await ah.fetchAllGroupEvents(group.group_id, group.calendar_id)
    events = events.filter(e => e.extendedProperties.shared.status === 'ongoing')
    for (const event of events) {
      const parentIds = JSON.parse(event.extendedProperties.shared.parents)
      const childIds = JSON.parse(event.extendedProperties.shared.children)
      const parents = await Profile.find({ user_id: { $in: parentIds } })
      const children = await Child.find({ child_id: { $in: childIds } })
      event.extendedProperties.shared.parents = JSON.stringify(
        parents.map(parent => `${parent.given_name} ${parent.family_name}`)
      )
      event.extendedProperties.shared.children = JSON.stringify(
        children.map(child => `${child.given_name} ${child.family_name}`)
      )
    }
    groupAgenda.createExcel(group, activities, events, () => {
      const mailOptions = {
        from: process.env.SERVER_MAIL,
        to: req.email,
        subject: `${group.name} group agenda`,
        html: groupAgenda.newGroupAgendaEmail(group.name),
        attachments: [
          {
            filename: `agenda.xlsx`,
            path: path.join(__dirname, `../../agenda.xlsx`)
          }
        ]
      }
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) next(err)
        fr('../', { files: `agenda.xlsx` })
      })
      res.status(200).send('Group Agenda sent')
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/plans', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const user_id = req.user_id
  const group_id = req.params.id
  try {
    const { from, to, description, name, location, deadline } = req.body
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    if (!(from || to || description || name || location || deadline)) {
      return res.status(400).send('Bad request')
    }
    await Plan.create({
      plan_id: objectid(),
      state: 'needs',
      from,
      to,
      description,
      name,
      location,
      creator_id: user_id,
      group_id,
      deadline,
      ratio: 2,
      min_volunteers: 2,
      participants: [],
      category: ''
    })
    res.status(200).send('Plan was created')
  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.get('/:groupId/plans', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const userId = req.user_id
  const { groupId } = req.params
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const plans = await Plan.find({ group_id: groupId })
    if (plans.length === 0) {
      return res.status(404).send('Group has no ongoing plans')
    }
    return res.json(plans)
  } catch (err) {
    next(err)
  }
})

router.get('/:groupId/plans/:planId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const userId = req.user_id
  const { groupId, planId } = req.params
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const plan = await Plan.findOne({ group_id: groupId, plan_id: planId })
    if (!plan) {
      return res.status(404).send('Plan doesnt exist')
    }
    return res.json(plan)
  } catch (err) {
    next(err)
  }
})

router.patch('/:groupId/plans/:planId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const userId = req.user_id
  const { groupId, planId } = req.params
  const { plan } = req.body
  const oldPlan = await Plan.findOne({ plan_id: planId })
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (plan.participants) {
      plan.participants = [plan.participants.find(p => p.user_id === userId), ...oldPlan.participants.filter(p => p.user_id !== userId)]
    }
    if (plan.participants) {
      plan.participants = await ph.syncChildSubscriptions(plan.participants)
    }
    const updatedPlan = await Plan.findOneAndUpdate({ plan_id: planId }, { ...plan }, { new: true })
    if (oldPlan.state !== updatedPlan.state) {
      nh.planStateNotification(plan.name, updatedPlan.participants.map(p => p.user_id), updatedPlan.state, groupId, planId)
    }
    if (updatedPlan.state === 'planning') {
      const updatedPlanObj = await updatedPlan.toJSON()
      updatedPlan.solution = ph.findOptimalSolution(updatedPlanObj)
      await updatedPlan.save()
    }
    return res.status(200).send('Plan was updated')
  } catch (err) {
    next(err)
  }
})

router.delete('/:groupId/plans/:planId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { groupId: group_id, planId: plan_id } = req.params
  const { user_id } = req
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    await Plan.deleteOne({ plan_id })
    res.status(200).send('Plan was deleted successfully')
  } catch (err) {
    next(err)
  }
})

router.post('/:groupId/plans/:planId/export', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { groupId: group_id, planId: plan_id } = req.params
  const { user_id } = req
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    const plan = await Plan.findOne({ plan_id })
    ph.createExcel(plan, () => {
      const mailOptions = {
        from: process.env.SERVER_MAIL,
        to: req.email,
        subject: `Plan: ${plan.name} `,
        html: ph.newExportEmail(plan.name),
        attachments: [
          {
            filename: `plan.xlsx`,
            path: path.join(
              __dirname,
              `../../plan.xlsx`
            )
          }
        ]
      }
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.log(err)
        console.log(info)
        fr('../', { files: `plan.xlsx` })
      })
      res.status(200).send('Exported pan successfully')
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:groupId/plans/:planId/activities', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { planId: plan_id, groupId: group_id } = req.params
  const { plan } = req.body
  const { user_id } = req
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    const group = await Group.findOne({ group_id })
    if (plan.activitiesCreation === 'automatically') {
      const [activity, events] = ph.transformPlanToActivities(plan, group, user_id)
      await Promise.all(
        events.map(event =>
          calendar.events.insert({
            calendarId: group.calendar_id,
            resource: event
          })
        )
      )
      await Activity.create(activity)
      await Plan.deleteOne({ plan_id })
      res.status(200).send('Plan successfully transformed to activities')
    } else {
      ph.createSolutionExcel(plan, async () => {
        const mailOptions = {
          from: process.env.SERVER_MAIL,
          to: req.email,
          subject: `Plan: ${plan.name} `,
          html: ph.newExportEmail(plan.name),
          attachments: [
            {
              filename: `plan_solution.xlsx`,
              path: path.join(
                __dirname,
                `../../plan_solution.xlsx`
              )
            }
          ]
        }
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) next(err)
          fr('../', { files: `plan_solution.xlsx` })
        })
        await Plan.deleteOne({ plan_id })
        res.status(200).send('Exported plan solution successfully')
      })
    }
  } catch (err) {
    next(err)
  }
})

router.post('/:id/activities', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const user_id = req.user_id
  const group_id = req.params.id
  try {
    const { activity, events } = req.body
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!(events && activity)) {
      return res.status(400).send('Bad Request')
    }
    const activity_id = objectid()
    activity.status = member.admin ? 'accepted' : 'pending'
    activity.activity_id = activity_id
    const group = await Group.findOne({ group_id })
    activity.group_name = group.name
    events.forEach(event => { event.extendedProperties.shared.activityId = activity_id })
    await Promise.all(
      events.map(event =>
        calendar.events.insert({
          calendarId: group.calendar_id,
          resource: event
        })
      )
    )
    await Activity.create(activity)
    if (member.admin) {
      await nh.newActivityNotification(group_id, user_id)
    }
    res.json({ status: activity.status })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/activities', (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const user_id = req.user_id
  Member.findOne({
    group_id,
    user_id,
    group_accepted: true,
    user_accepted: true
  })
    .then(member => {
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      return Activity.find({ group_id })
        .sort({ createdAt: -1 })
        .lean()
        .exec()
        .then(activities => {
          if (activities.length === 0) {
            return res.status(404).send('Group has no activities')
          }
          res.json(activities)
        })
    })
    .catch(next)
})

router.patch('/:id/activities/:activityId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.id
  const user_id = req.user_id
  try {
    const activity_id = req.params.activityId
    const activityPatch = req.body
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    const activity = await Activity.findOne({
      activity_id: req.params.activityId
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!(member.admin || activity.creator_id === user_id)) {
      return res.status(401).send('Unauthorized')
    }
    if (
      !(
        activityPatch.name ||
        activityPatch.description ||
        activityPatch.color ||
        activityPatch.status
      )
    ) {
      return res.status(400).send('Bad Request')
    }
    await Activity.updateOne({ activity_id }, activityPatch)
    if (activityPatch.status === 'accepted') {
      await nh.newActivityNotification(group_id, activity.creator_id)
    }
    res.status(200).send('Activity was updated')
  } catch (error) {
    next(error)
  }
})

router.delete('/:groupId/activities/:activityId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const group_id = req.params.groupId
    const user_id = req.user_id
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    const group = await Group.findOne({ group_id })
    const activity_id = req.params.activityId
    const resp = await calendar.events.list({
      calendarId: group.calendar_id,
      sharedExtendedProperty: `activityId=${activity_id}`
    })
    const activityTimeslots = resp.data.items
    await activityTimeslots.reduce(async (previous, event) => {
      await previous
      return calendar.events.delete({
        eventId: event.id,
        calendarId: group.calendar_id
      })
    }, Promise.resolve())
    const activity = await Activity.findOneAndDelete({ activity_id })
    await nh.deleteActivityNotification(user_id, activity.name, activityTimeslots)
    res.status(200).send('Activity Deleted')
  } catch (error) {
    next(error)
  }
})

router.get('/:groupId/activities/:activityId', (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { activityId } = req.params
  Member.findOne({
    group_id: req.params.groupId,
    user_id: req.user_id,
    group_accepted: true,
    user_accepted: true
  })
    .then(member => {
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      return Activity.findOne({ activity_id: activityId })
        .lean()
        .exec()
        .then(activity => {
          if (!activity) {
            return res.status(404).send('Activity not found')
          }
          res.json(activity)
        })
    })
    .catch(next)
})

router.post('/:groupId/activities/:activityId/export', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { format } = req.body
  const group_id = req.params.groupId
  const user_id = req.user_id
  const activity_id = req.params.activityId
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const activity = await Activity.findOne({ activity_id })
    if (!(member.admin || user_id === activity.creator_id)) {
      return res.status(401).send('Unauthorized')
    }
    const group = await Group.findOne({ group_id })
    const resp = await calendar.events.list({
      calendarId: group.calendar_id,
      sharedExtendedProperty: `activityId=${activity_id}`
    })
    const activityTimeslots = resp.data.items
    if (format === 'pdf') {
      exportActivity.createPdf(activity, activityTimeslots, () => {
        const mailOptions = {
          from: process.env.SERVER_MAIL,
          to: req.email,
          subject: `Activity: ${activity.name} `,
          html: exportActivity.newExportEmail(activity.name),
          attachments: [
            {
              filename: `activity.pdf`,
              path: path.join(
                __dirname,
                `../../activity.pdf`
              )
            }
          ]
        }
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) next(err)
          if (format === 'excel') {
            fr('../', { files: `activity.xlsx` })
          } else {
            fr('../../', { files: `activity.pdf` })
          }
        })
        res.status(200).send('Exported activity successfully')
      })
    } else if (format === 'excel') {
      exportActivity.createExcel(activity, activityTimeslots, () => {
        const mailOptions = {
          from: process.env.SERVER_MAIL,
          to: req.email,
          subject: `Activity: ${activity.name} `,
          html: exportActivity.newExportEmail(activity.name),
          attachments: [
            {
              filename: `activity.xlsx`,
              path: path.join(
                __dirname,
                `../../activity.xlsx`
              )
            }
          ]
        }
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) next(err)
          fr('../', { files: `activity.xlsx` })
        })
        res.status(200).send('Exported activity successfully')
      })
    }
  } catch (error) {
    next(error)
  }
})

router.get('/:groupId/activities/:activityId/timeslots', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.groupId
  const activity_id = req.params.activityId
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const group = await Group.findOne({ group_id })
    const resp = await calendar.events.list({
      calendarId: group.calendar_id,
      sharedExtendedProperty: `activityId=${activity_id}`
    })
    const activityTimeslots = resp.data.items
    res.json(activityTimeslots)
  } catch (error) {
    next(error)
  }
})

router.get('/:groupId/activities/:activityId/timeslots/:timeslotId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const group_id = req.params.groupId
  const user_id = req.user_id
  const activity_id = req.params.activityId
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const activity = await Activity.findOne({ activity_id })
    const group = await Group.findOne({ group_id })
    const response = await calendar.events.get({
      calendarId: group.calendar_id,
      eventId: req.params.timeslotId
    })
    response.data.userCanEdit = false
    if (member.admin || user_id === activity.creator_id) {
      response.data.userCanEdit = true
    }
    res.json(response.data)
  } catch (error) {
    next(error)
  }
})

router.patch('/:groupId/activities/:activityId/timeslots/:timeslotId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const {
      adminChanges,
      summary,
      description,
      location,
      start,
      end,
      extendedProperties,
      notifyUsers
    } = req.body
    if (
      !(
        summary ||
        description ||
        location ||
        start ||
        end ||
        extendedProperties
      )
    ) {
      return res.status(400).send('Bad Request')
    }
    const group = await Group.findOne({ group_id })
    const myChildren = await Parent.distinct('child_id', { parent_id: req.user_id })
    const event = await calendar.events.get({
      calendarId: group.calendar_id,
      eventId: req.params.timeslotId
    })
    const oldParents = JSON.parse(event.data.extendedProperties.shared.parents)
    const oldChildren = JSON.parse(event.data.extendedProperties.shared.children)
    const parents = JSON.parse(extendedProperties.shared.parents)
    const children = JSON.parse(extendedProperties.shared.children)
    if (!member.admin) {
      if (parents.includes(req.user_id)) {
        extendedProperties.shared.parents = JSON.stringify([...new Set([...oldParents, req.user_id])])
      } else {
        extendedProperties.shared.parents = JSON.stringify(oldParents.filter(u => u !== req.user_id))
      }
      myChildren.forEach(c => {
        if (children.includes(c) && !oldChildren.includes(c)) {
          oldChildren.push(c)
        } else if (!children.includes(c) && oldChildren.includes(c)) {
          oldChildren.splice(oldChildren.indexOf(c), 1)
        }
      })
      extendedProperties.shared.children = JSON.stringify(oldChildren)
    } else {
      if (adminChanges) {
        if (Object.keys(adminChanges).length > 0) {
          Object.keys(adminChanges).forEach(id => {
            if (adminChanges[id] > 0) {
              adminChanges[id] = 'add'
            } else if (adminChanges[id] < 0) {
              adminChanges[id] = 'remove'
            } else {
              delete adminChanges[id]
            }
          })
          nh.timeslotAdminChangesNotification(summary, adminChanges, req.user_id, group_id, activity_id, timeslot_id)
        }
      }
    }
    const externals = JSON.parse(extendedProperties.shared.externals || '[]')
    const volunteersReq =
      (parents.length + externals.length) >= extendedProperties.shared.requiredParents
    const childrenReq =
      children.length >= extendedProperties.shared.requiredChildren
    if (event.data.extendedProperties.shared.status !== extendedProperties.shared.status) {
      nh.timeslotStatusChangeNotification(summary, extendedProperties.shared.status, oldParents, group_id, activity_id, timeslot_id)
    }
    if (notifyUsers) {
      extendedProperties.shared.parents = JSON.stringify([])
      extendedProperties.shared.children = JSON.stringify([])
      extendedProperties.shared.externals = JSON.stringify([])
      await nh.timeslotMajorChangeNotification(summary, oldParents, group_id, activity_id, timeslot_id)
    } else if (volunteersReq && childrenReq) {
      await nh.timeslotRequirementsNotification(summary, parents, group_id, activity_id, timeslot_id)
    }
    if (JSON.parse(extendedProperties.shared.children).length > 37) {
      extendedProperties.shared.children = JSON.stringify(JSON.parse(extendedProperties.shared.children).slice(0, 36))
    }
    if (JSON.parse(extendedProperties.shared.parents).length > 37) {
      extendedProperties.shared.parents = JSON.stringify(JSON.parse(extendedProperties.shared.parents).slice(0, 36))
    }
    const timeslotPatch = {
      summary,
      description,
      location,
      start,
      end,
      extendedProperties
    }
    await calendar.events.patch({
      calendarId: group.calendar_id,
      eventId: req.params.timeslotId,
      resource: timeslotPatch
    })
    res.status(200).send('Timeslot was updated')
  } catch (error) {
    next(error)
  }
})

router.post('/:groupId/activities/:activityId/timeslots/add', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { groupId: group_id, activityId: activity_id } = req.params
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const {
      summary,
      description,
      location,
      start,
      end,
      extendedProperties
    } = req.body
    if (
      !(
        summary ||
        description ||
        location ||
        start ||
        end ||
        extendedProperties
      )
    ) {
      return res.status(400).send('Bad Request')
    }
    const event = {
      summary,
      description,
      location,
      start,
      end,
      extendedProperties
    }
    event.extendedProperties.shared.activityId = activity_id
    event.extendedProperties.shared.groupId = group_id
    const group = await Group.findOne({ group_id })
    await calendar.events.insert({
      calendarId: group.calendar_id,
      resource: event
    })
    res.status(200).send('Timeslot was created')
  } catch (error) {
    next(error)
  }
})

router.delete('/:groupId/activities/:activityId/timeslots/:timeslotId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const { groupId: group_id, activityId: activity_id } = req.params
  const user_id = req.user_id
  const { summary, parents } = req.query
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    const activity = await Activity.findOne({ activity_id })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!(member.admin || user_id === activity.creator_id)) {
      return res.status(401).send('Unauthorized')
    }
    if (!(summary && parents)) {
      return res.status(400).send('Bad Request')
    }
    const group = await Group.findOne({ group_id })
    await calendar.events.delete({
      calendarId: group.calendar_id,
      eventId: req.params.timeslotId
    })
    nh.deleteTimeslotNotification(user_id, { summary, parents: JSON.parse(parents) })
    res.status(200).send('Timeslot was deleted')
  } catch (error) {
    next(error)
  }
})

/** Announcements **/
const AnnouncementType = {
  GROUP: 'group',
  ACTIVITY: 'activity'
}

function getAnnouncements (type) {
  return (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const group_id = req.params.groupId
    const activity_id = type === AnnouncementType.ACTIVITY ? req.params.activityId : null
    const user_id = req.user_id
    Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
      .then(member => {
        if (!member) {
          return res.status(401).send('Unauthorized')
        }
        let find = type === AnnouncementType.GROUP ? { group_id: group_id, activity_id: null } : { activity_id: activity_id }
        return Announcement.find(find)
          .populate('images')
          .sort({ createdAt: -1 })
          .lean()
          .exec()
          .then(announcements => {
            if (announcements.length === 0) {
              return res.status(404).send('Group has no announcements')
            }
            res.json(announcements)
          })
      })
      .catch(next)
  }
}

function postAnnouncement (type) {
  return async (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const group_id = req.params.groupId
    const activity_id = type === AnnouncementType.ACTIVITY ? req.params.activityId : null
    const user_id = req.user_id
    const { message } = req.body
    const announcement_id = objectid()
    const { files } = req
    try {
      const member = await Member.findOne({
        group_id,
        user_id,
        group_accepted: true,
        user_accepted: true
      })
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      if (!(files || message)) {
        return res.status(400).send('Bad Request')
      }
      const announcement = {
        announcement_id: announcement_id,
        user_id: user_id,
        group_id: group_id,
        body: message,
        activity_id: activity_id
      }
      if (files) {
        const images = []
        files.forEach(photo => {
          images.push({
            image_id: objectid(),
            owner_type: 'announcement',
            owner_id: announcement_id,
            path: `/images/announcements/${photo.filename}`
          })
        })
        await Image.create(images)
      }
      await Announcement.create(announcement)
      await nh.newAnnouncementNotification(group_id, user_id)
      res.status(200).send('Announcement was posted')
    } catch (err) {
      next(err)
    }
  }
}

function deleteAnnouncement (type) {
  return async (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const announcement_id = req.params.announcementId
    const user_id = req.user_id
    const group_id = req.params.groupId
    try {
      const member = await Member.findOne({
        group_id,
        user_id,
        group_accepted: true,
        user_accepted: true
      })
      const announcement = await Announcement.findOne({ announcement_id })
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      if (!(member.admin || user_id === announcement.user_id)) {
        return res.status(401).send('Unauthorized')
      }
      await Announcement.deleteOne({ announcement_id })
      await Image.deleteMany({
        owner_type: 'announcement',
        owner_id: announcement_id
      })
      await Reply.deleteMany({ announcement_id })
      res.status(200).send('announcement was deleted')
    } catch (error) {
      next(error)
    }
  }
}

function postAnnouncementReply (type) {
  return async (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const announcement_id = req.params.announcementId
    const group_id = req.params.groupId
    const user_id = req.user_id
    try {
      const member = await Member.findOne({
        group_id,
        user_id,
        group_accepted: true,
        user_accepted: true
      })
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      if (!req.body.message) {
        return res.status(400).send('Bad Request')
      }
      const reply = {
        announcement_id,
        body: req.body.message,
        user_id
      }
      await Reply.create(reply)
      await nh.newReplyNotification(group_id, req.user_id)
      res.status(200).send('Reply was posted')
    } catch (error) {
      next(error)
    }
  }
}

function getAnnouncementReplies (type) {
  return (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const announcement_id = req.params.announcementId
    const user_id = req.user_id
    const group_id = req.params.groupId
    Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
      .then(member => {
        if (!member) {
          return res.status(401).send('Unauthorized')
        }
        return Reply.find({ announcement_id }).then(replies => {
          if (replies.length === 0) {
            return res.status(404).send('Announcement has no replies')
          }
          res.json(replies)
        })
      })
      .catch(next)
  }
}

function deleteAnnouncementReply (type) {
  return async (req, res, next) => {
    if (!req.user_id) {
      return res.status(401).send('Not authenticated')
    }
    const reply_id = req.params.replyId
    const group_id = req.params.groupId
    const user_id = req.user_id
    try {
      const member = await Member.findOne({
        group_id,
        user_id,
        group_accepted: true,
        user_accepted: true
      })
      if (!member) {
        return res.status(401).send('Unauthorized')
      }
      const reply = await Reply.findOne({ reply_id })
      if (!(member.admin || user_id === reply.user_id)) {
        return res.status(401).send('Unauthorized')
      }
      await Reply.deleteOne({ reply_id })
      res.status(200).send('reply was deleted')
    } catch (error) {
      next(error)
    }
  }
}

router.get('/:groupId/announcements', getAnnouncements(AnnouncementType.GROUP))
router.post('/:groupId/announcements', announcementUpload.array('photo', 3), postAnnouncement(AnnouncementType.GROUP))
router.delete('/:groupId/announcements/:announcementId', deleteAnnouncement(AnnouncementType.GROUP))
router.post('/:groupId/announcements/:announcementId/replies', postAnnouncementReply(AnnouncementType.GROUP))
router.get('/:groupId/announcements/:announcementId/replies', getAnnouncementReplies(AnnouncementType.GROUP))
router.delete('/:groupId/announcements/:announcementId/replies/:replyId', deleteAnnouncementReply(AnnouncementType.GROUP))

router.get('/:groupId/activities/:activityId/announcements', getAnnouncements(AnnouncementType.ACTIVITY))
router.post('/:groupId/activities/:activityId/announcements', announcementUpload.array('photo', 3), postAnnouncement(AnnouncementType.ACTIVITY))
router.delete('/:groupId/activities/:activityId/announcements/:announcementId', deleteAnnouncement(AnnouncementType.ACTIVITY))
router.post('/:groupId/activities/:activityId/announcements/:announcementId/replies', postAnnouncementReply(AnnouncementType.ACTIVITY))
router.get('/:groupId/activities/:activityId/announcements/:announcementId/replies', getAnnouncementReplies(AnnouncementType.ACTIVITY))
router.delete('/:groupId/activities/:activityId/announcements/:announcementId/replies/:replyId', deleteAnnouncementReply(AnnouncementType.ACTIVITY))

/**
 * @apiName report a user
 * @apiGroup Group
 *
 * @apiParam {groupId} the id of the group
 * @apiParam {memberId} the id of the user want to report
 * @apiBody {message} the message of the report
 *
 */
router.put('/:groupId/members/:memberId/report', async (req, res, next) => {
  if (!req.user_id) {return res.status(401).send('Unauthorized')}
  try {
    const group_id = req.params.groupId
    const member_id = req.params.memberId
    const reporter = await Member.findOne({
      group_id,
      user_id: req.user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!reporter) {
      return res.status(401).send('Unauthorized')
    }

    const reported = await Member.findOne({
      group_id,
      user_id: member_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!reported) {return res.status(404).send('Member does not exist')}

    if (!req.body.message) {return res.status(400).send('Bad request')}
    if (req.user_id === member_id) {return res.status(400).send('You cannot report yourself')}
    let insertAllowed = true;
    const one_day_ms = 1000*60*60*24;
    reported.reports.forEach(report => {
      if (report._id === req.user_id) {
        const report_date = new Date(report.createdAt);
        if(now() - report_date.getTime() < one_day_ms)
          insertAllowed = false;
      }
    });
    if (!insertAllowed) {return res.status(400).send('Bad request')}
    let newReport = {
      _id: req.user_id,
      message: req.body.message,
    }
    reported.reports.push(newReport)
    reported.save().then((updatedMember) => {
      return res.status(200).json(updatedMember)
    })
  } catch(err) {
    next(err)
  }
})

/** route per valutare un'attività, andrebbe messa in un punto migliore nel file, ma intanto la lascio qui
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 *
 * @apiBody {rate} rate between 1 and 5
 *
 */
router.post('/:groupId/activities/:activityId/valutation', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Unauthorized') }
  const userId = req.user_id
  const { groupId } = req.params
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }

    if (!req.body.rate || req.body.rate < 1 || req.body.rate > 5) { return res.status(400).send('Bad request') }
    Activity.findOne({ activity_id: req.params.activityId }, (_err, activity) => {
      if (!activity) { return res.status(500).send('Activity does not exist') }
      let alreadyInserted = false
      if (activity.valutations) {
        activity.valutations.forEach(valutation => {
          if (valutation._id === req.user_id) {
            valutation.rate = req.body.rate
            alreadyInserted = true
          }
        })
        if(!alreadyInserted) {
          let newValutation = { _id: req.user_id, rate: req.body.rate }
          activity.valutations.push(newValutation)
        }
      }
      activity.save(err => {
        if (err) { return res.status(500).send('error while saving') }
      })
    }).then(() => {
      return res.status(200).send('rate inserted correctly')
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/survey', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated');
  }
  const user_id = req.user_id;
  const group_id = req.params.id;
  try {
    const { name, location, color, possibilities, multipleChoiceAllowed } = req.body;
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    if (!member.admin) {
      return res.status(401).send('Unauthorized')
    }
    if (!(name.length > 0 && location.length > 0 && color.length > 0 && possibilities.length > 1)) {
      return res.status(400).send('Bad request')
    }
    possibilities.forEach((_possibility) => _possibility.possibility_id = objectid() )
    await Survey.create({
      survey_id: objectid(),
      group_id,
      creator_id: user_id,
      name,
      location,
      color,
      possibilities,
      multipleChoiceAllowed,
    })
    res.status(200).send('Survey was created')
    console.log(color);
  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.get('/:groupId/surveys', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  const userId = req.user_id
  const { groupId } = req.params
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const surveys = await Survey.find({ group_id: groupId })
    if (surveys.length === 0) {
      return res.status(404).send('Group has no ongoing surveys')
    }
    return res.json(surveys)
  } catch (err) {
    next(err)
  }
})

router.get('/:groupId/surveys/:surveyId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated');
  }
  const userId = req.user_id;
  const { groupId, surveyId } = req.params;
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized');
    }
    const survey = await Survey.findOne({ group_id: groupId, survey_id: surveyId });
    if(!survey)
      return res.status(500).send('survey does not exist');
    return res.json(survey);
  } catch (err) {
    next(err);
  }
})

router.patch('/:groupId/surveys/:surveyId/votes/:possibilityId', async (req, res, next) => {
  if (!req.user_id) { return res.status(401).send('Unauthorized'); }
  const { groupId, surveyId, possibilityId } = req.params;
  const userId = req.user_id;
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id: userId,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    const survey = await Survey.findOne({ survey_id: surveyId });
    if(!survey)
      return res.status(500).send('survey does not exist');
    const possibility = survey.possibilities.find((_possibility) => _possibility.possibility_id === possibilityId);
    if(!possibility)
      return res.status(500).send('possibility does not exist');
    let deleted = false;
    if(possibility.votes.includes(req.user_id)){
      possibility.votes.splice(possibility.votes.indexOf(req.user_id),1);
      deleted = true;
    }
    else{
      if(!survey.multipleChoiceAllowed){
        for(let _possibility of survey.possibilities){
          _possibility.votes = _possibility.votes.filter(vote => vote !== req.user_id);
        }
      }
      let newVote = { _id: req.user_id };
      possibility.votes.push(newVote);
    }
    survey.save(err => {
      if (err) { return res.status(500).send('error while saving'); }
    })
    if(deleted)
      return res.status(200).send('vote deleted correctly');
    else
      return res.status(200).send('vote inserted correctly');
  } catch (error) {
    next(error);
  }
})

router.delete('/:groupId/surveys/:surveyId', async (req, res, next) => {
  if (!req.user_id) {
    return res.status(401).send('Not authenticated');
  }
  const { groupId, surveyId } = req.params
  const { user_id } = req
  try {
    const member = await Member.findOne({
      group_id: groupId,
      user_id,
      group_accepted: true,
      user_accepted: true
    });
    if (!member) {
      return res.status(401).send('Unauthorized');
    }
    const survey = await Survey.findOne({ survey_id: surveyId });
    if(!survey){
      return res.status(500).send('survey does not exist');
    }
    if(survey.creator_id !== user_id){
      return res.status(401).send('Unauthorized');
    }
    await Survey.deleteOne({ survey_id: surveyId });
    res.status(200).send('Survey was deleted successfully');
  } catch (err) {
    next(err)
  }
})


router.get('/:groupId/trace/:memberId', async (req, res, next)=>{
  let group;
  if (!req.user_id){
    return res.status(401).send('Not authenticated')
  }
  Member.findOne({group_id: req.params.groupId, user_id: req.user_id}).then( u => {
    if (u === null || u === undefined || !u.admin)
      return res.status(403).send('Unauthorized');
    Notification.findOne({owner_id: req.user_id, object: req.params.memberId, type:'positivity', code: 0 }).then( n =>{
      if (!n)
        return res.status(403).send('Notification not received for this user')
      Group.findOne({group_id: req.params.groupId}).then(g => {
        uh.getUsersGroupEvents(g.calendar_id, req.params.memberId, []).then(e =>{
          e = e.filter( i => {
            let notifDate = new Date(n.createdAt)
            let eventDate = new Date(i.start.dateTime)
            return eventDate.getTime() > notifDate.getTime() - 1000*60*60*24*7;
          })
          let contacts = {parents:[], children:[]}
          e.map(i => {
            let p = i.extendedProperties.shared.parents;
            if (p !== "[]")
              p = p.slice(1, p.length - 1).split(',').map( s => s.slice(1, s.length-1));
            else p = []
            let c = i.extendedProperties.shared.children;
            if (c !== "[]")
              c = c.slice(1, c.length - 1).split(',').map( s => s.slice(1, s.length-1));
            else c = []

            contacts.parents.push(...p);
            contacts.children.push(...c);
          })
          contacts.parents = [...new Set(contacts.parents)]
          contacts.children = [...new Set(contacts.children)]

          contacts.parents = contacts.parents.map(e => {return {user_id: e}})
          return res.status(200).send(contacts)
        })
      })
    })
  })
})

/**
 * get all cars status for a timeslot
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 * @apiParam {timeslotId}
 */
router.get('/:groupId/activities/:activityId/timeslots/:timeslotId/rides', async (req, res, next) => {
  if (!req.user_id){ return res.status(401).send('Not authenticated') }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    let rides = await TimeslotCarRides.findOne({timeslot_id: timeslot_id})
    if (!rides) {
      return res.status(200).json({'cars':[]})
    }
    return res.status(200).json(rides);
  } catch (error) {
    next(error)
  }
})


const carSharingLock = new AsyncLock();
/**
 * give a seat on your car
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 * @apiParam {timeslotId}
 */
router.post('/:groupId/activities/:activityId/timeslots/:timeslotId/rides', async (req, res, next) => {
  if (!req.user_id){ return res.status(401).send('Not authenticated') }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }

    carSharingLock.acquire('carSharingLock', async function (lockRelease) {
      let rides = await TimeslotCarRides.findOne({ timeslot_id: timeslot_id })
      if (rides) {
        let cars = rides.cars
        let has_car = false;
        let error = false;
        cars.forEach(car => {
          if (car.passengers.includes(user_id)) {
            error = true;
          }
        })
        if (error) {
          lockRelease()
          return res.status(400).send('You cannot drive if you are already a passenger')
        }
        cars.forEach(car => {
          if (car._id === user_id) {
            car.seats++;
            has_car = true;
          }
        })
        if (!has_car) {
          cars.push({
            _id: user_id,
            seats: 1,
            passengers: []
          })
        }
        rides.save().then(() => {
          lockRelease()
          return res.status(200).json(rides)
        }).catch((err) => {
          lockRelease()
          console.log(err)
        })
      } else {
        const newRides = new TimeslotCarRides({
          timeslot_id: timeslot_id,
          cars: [{
            _id: user_id,
            seats: 1,
            passengers: []
          }]
        })
        await newRides.save(err => {
          lockRelease()
          if (err) return next(err)
        })
        lockRelease()
        return res.status(200).json(newRides)
      }
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * book a seat on a car
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 * @apiParam {timeslotId}
 *
 * @apiBody {driver_id}
 */
router.put('/:groupId/activities/:activityId/timeslots/:timeslotId/rides', async (req, res, next) => {
  if (!req.user_id){ return res.status(401).send('Not authenticated') }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  const driver_id = req.body.driver_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }
    carSharingLock.acquire('carSharingLock', async function (lockRelease) {
      let rides = await TimeslotCarRides.findOne({ timeslot_id: timeslot_id })
      if (rides) {
        let cars = rides.cars
        let error = false;
        cars.forEach(car => {
          if (car._id === user_id) {
            error = true;
          }
        })
        if (error) {
          lockRelease()
          return res.status(400).send('you cannot be a passenger if you already drive')
        }
        cars.forEach(car => {
          if (car._id === driver_id) {
            if (car.seats > car.passengers.length) {
              car.passengers.push(user_id)
            }
          }
        })
        rides.save().then(() => {
          lockRelease()
          return res.status(200).json(rides)
        }).catch((err) => {
          lockRelease()
          console.log(err)
        })
      } else {
        lockRelease()
        return res.status(404).json('wrong timeslot?')
      }
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * release a seat previously booked
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 * @apiParam {timeslotId}
 *
 * @apiBody {driver_id}
 */
router.patch('/:groupId/activities/:activityId/timeslots/:timeslotId/rides', async (req, res, next) => {
  if (!req.user_id){ return res.status(401).send('Not authenticated') }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  const driver_id = req.body.driver_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }

    carSharingLock.acquire('carSharingLock', async function (lockRelease) {
      let rides = await TimeslotCarRides.findOne({ timeslot_id: timeslot_id })
      if (rides) {
        let cars = rides.cars
        cars.forEach(car => {
          if (car._id === driver_id) {
            let index = car.passengers.indexOf(user_id)
            if (index > -1) {
              car.passengers.splice(index, 1);
            }
          }
        })
        rides.save().then(() => {
          lockRelease()
          return res.status(200).json(rides)
        }).catch((err) => {
          lockRelease()
          console.log(err)
        })
      } else {
        lockRelease()
        return res.status(404).json('wrong timeslot?')
      }
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * remove a seat on your car
 *
 * @apiParam {groupId}
 * @apiParam {activityId}
 * @apiParam {timeslotId}
 */
router.delete('/:groupId/activities/:activityId/timeslots/:timeslotId/rides', async (req, res, next) => {
  if (!req.user_id){ return res.status(401).send('Not authenticated') }
  const { groupId: group_id, activityId: activity_id, timeslotId: timeslot_id } = req.params
  const user_id = req.user_id
  try {
    const member = await Member.findOne({
      group_id,
      user_id,
      group_accepted: true,
      user_accepted: true
    })
    if (!member) {
      return res.status(401).send('Unauthorized')
    }

    carSharingLock.acquire('carSharingLock', async function (lockRelease) {
      let rides = await TimeslotCarRides.findOne({ timeslot_id: timeslot_id })
      if (rides) {
        let cars = rides.cars
        cars.forEach(car => {
          if (car._id === user_id) {
            car.seats--;
            if (car.seats < car.passengers.length) {
              let removedPassenger = car.passengers.pop();
              nh.newRemovedSeatNotification(user_id, removedPassenger)
            }
            if (car.seats === 0) {
              let index = rides.cars.indexOf(car)
              rides.cars.splice(index, 1)
            }
          }
        })
        rides.save().then(() => {
          lockRelease()
          return res.status(200).json(rides)
        }).catch((err) => {
          lockRelease()
          console.log(err)
        })
      } else {
        lockRelease()
        return res.status(404).json('wrong timeslot?')
      }
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
