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
const nodemailer = require('nodemailer')
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

const Family = require('../models/family')

/**
 * @api {get} /api/family/ get a family
 *    requires to be a member of the family
 * @apiName GetFamily
 * @apiGroup Family
 *
 * @apiBody {familyId} family id.
 *
 * @apiSuccess {Family} the family requested.
 */
router.get('/', async (req, res, next) => { // TODO: to test
  try {
    const family = await Family.findById(req.body.familyId)
    if (!family.members.includes(req.user_id)) {
      // a user can get a family only if he's a member
      return res.status(401).send('Not authenticated')
    }
    res.status(200).json(family)
  } catch (e) {
    next(e)
  }
})

/**
 * create a new family
 * requires to be authenticated
 */
router.post('/', async (req, res, next) => { // TODO: to test
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const members = [req.user_id]
    const name = req.body.name
    const familyCalendar = {
      summary: name + '-familyCalendar'
    }
    const newFamily = {
      name,
      members
    }
    const response = await calendar.calendars.insert({ resource: familyCalendar })
    newFamily.calendar_id = response.data.id
    await Family.create(newFamily, (err) => {
      console.log(err)
      throw err
    })
    res.status(200).send('Family created')
  } catch (e) {
    next(e)
  }
})

/**
 * add someone to a family
 * requires to be a member of the family
 */
router.put('/:id', async (req, res, next) => { // TODO: to test
  try {
    const { id } = req.params
    const family = await Family.findById(id)
    if (!family.members.includes(req.user_id)) {
      // a user can update a family only if he's a member
      return res.status(401).send('Not authenticated')
    }
    family.members.push(req.body.memberId)
    await family.save()
    res.status(200).send('Family updated correctly')
  } catch (e) {
    next(e)
  }
})

module.exports = router
