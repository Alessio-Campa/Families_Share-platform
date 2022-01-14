const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Activity = require('../../src/models/activity')

describe('/Post/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should not add a seat on his car (not authenticated)', async () => {
    const user = await User.findOne({ email: "my_user2@email.com" });
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', 'invalidToken')
    res.should.have.status(401);
  })
})

describe('/Post/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should not add a seat on his car (not a member of the group)', async () => {
    const user = await User.findOne({ email: "test2@notInGroup.com" });
    const userForTimeslot = await User.findOne({email: "my_user2@email.com"});
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', userForTimeslot.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    res.should.have.status(401);
    res.text.should.equal("Unauthorized")
  })
})

describe('/Post/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should add a seat on his own car', async () => {
    const user = await User.findOne({ email: "my_user2@email.com" });
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    res.should.have.status(200);
    res.body.should.have.property('cars').with.lengthOf(1)
    res.body.cars[0]._id.should.equal(user.user_id)
  })
})

describe('/Put/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should book a seat on the previus add car', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const driver = await User.findOne({email: "my_user2@email.com"});
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .put(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
      .send({'driver_id': driver.user_id})
    res.should.have.status(200);
    res.body.should.have.property('cars').with.lengthOf(1)
    res.body.cars[0].should.have.property('passengers').with.lengthOf(1)
    res.body.cars[0].passengers[0].should.equal(user.user_id)
  })
})

describe('/Post/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should not add a seat on his own car because he is passenger on another car', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    res.should.have.status(400);
    res.text.should.equal("You cannot drive if you are already a passenger")
  })
})

describe('/Get/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should get the status of the rides', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    res.should.have.status(200);
    res.body.should.have.property('cars').with.lengthOf(1)
    res.body.cars[0].passengers[0].should.equal(user.user_id)
  })
})

describe('/Patch/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should release the seat previously booked', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const driver = await User.findOne({email: "my_user2@email.com"});
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .patch(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
      .send({'driver_id': driver.user_id})
    res.should.have.status(200);
    res.body.cars[0].should.have.property('passengers').with.lengthOf(0)
  })
})

describe('/Put/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should not book a seat because he is already driving', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const driver = await User.findOne({email: "my_user2@email.com"});
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const user2Driver = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    const res = await chai.request(server)
      .put(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
      .send({'driver_id': driver.user_id})
    res.should.have.status(400);
    res.text.should.equal("you cannot be a passenger if you already drive")  })
})

describe('/Delete/api/group/groupId/activities/activityId/timeslots/timeslotId/rides', () => {
  it('It should delete a seat on his car ', async () => {
    const user = await User.findOne({ email: "my_user2@email.com" });
    const driver = await User.findOne({email: "my_user@email.com"});
    const activity = await Activity.findOne({ location: 'Venezia'})
    const timeslot = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots`)
      .set('Authorization', user.token);
    const timeslotId = timeslot.body[0].id;
    const res = await chai.request(server)
      .delete(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/timeslots/${timeslotId}/rides`)
      .set('Authorization', user.token)
    res.should.have.status(200);
    res.body.should.have.property('cars').with.lengthOf(1)
    res.body.cars[0]._id.should.equal(driver.user_id)
  })
})
