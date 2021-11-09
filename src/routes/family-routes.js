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

/*
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SERVER_MAIL,
    pass: process.env.SERVER_MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
}) */

const Family = require('../models/family')

/**
 * @api {get} /api/family/ get a family
 *    requires to be a member of the family
 * @apiName GetFamily
 * @apiGroup Family
 *
 * @apiQuery {String} familyId
 *
 * @apiSuccess {Family} the family requested.
 */
router.get('/', async (req, res, next) => { // TODO: to test
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const family = await Family.findById(req.query.familyId)
    if (!family) {
      return res.status(500).send('This family does not exist')
    }
    if (!family.members.includes(req.user_id)) {
      // a user can get a family only if he's a member
      return res.status(403).send('Forbidden')
    }
    res.status(200).json(family)
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
router.get('/user', async (req, res, next) => { // TODO: to test
  console.log(req.user_id)
  if (!req.user_id) {
    return res.status(401).send('Not authenticated')
  }
  try {
    const families = await Family.find({
      members: req.user_id
    }).select('_id')
    res.status(200).json(families)
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
 * @apiBody {String} familyId
 *
 */
router.post('/', async (req, res, next) => { // TODO: to test
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    const members = [req.user_id]
    const familyName = req.body.familyName
    const familyCalendar = {
      summary: familyName + '-familyCalendar'
    }
    if (!familyName) { return res.status(400).send('Bad request') }
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
 */
router.put('/:id', async (req, res, next) => { // TODO: to test
  if (!req.user_id) { return res.status(401).send('Not authenticated') }
  try {
    const familyId = req.params.id
    const family = await Family.findById(familyId)
    if (!family.members.includes(req.user_id)) {
      // a user can update a family only if he's a member
      return res.status(403).send('Forbidden')
    }
    family.members.push(req.body.memberId)
    await family.save()
    res.status(200).send('Family updated correctly')
  } catch (e) {
    next(e)
  }
})

module.exports = router
