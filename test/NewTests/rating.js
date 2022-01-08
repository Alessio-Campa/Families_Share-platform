const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Group = require('../../src/models/group')
const Activity = require('../../src/models/activity')

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should not add a new evaluation user not logged', async () => {
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', 'invalidtoken')
      .send({ rate: 2 })
    res.should.have.status(401);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should not add a new evaluation user not part of the group', async () => {
    const user = await User.findOne({ email: "test2@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', user.token)
      .send({ rate: 2 })
    res.should.have.status(401);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should not add a new evaluation (rate is less than 1)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', user.token)
      .send({ rate: 0 })
    res.should.have.status(400);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should not add a new evaluation (rate is more than 5)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', user.token)
      .send({ rate: 6 })
    res.should.have.status(400);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should add a new evaluation (user is part of the group)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', user.token)
      .send({ rate: 2 })
    res.should.have.status(200);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should add a new evaluation (user is part of the group)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}`)
      .set('Authorization', user.token)
    res.should.have.status(200);
    res.body.valutations.should.be.a('array').with.lengthOf(1);
    res.body.valutations[0].rate.should.be.eql(2);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should update the evaluation (user is part of the group)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/valutation`)
      .set('Authorization', user.token)
      .send({ rate: 5 })
    res.should.have.status(200);
  })
})

describe('/Post/api/groups/groupId/activities/activityId/valutation', () => {
  it('It should add a new evaluation (user is part of the group)', async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const activity = await Activity.findOne({ name: "Attivita"})
    const res = await chai.request(server)
      .get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}`)
      .set('Authorization', user.token)
    res.should.have.status(200);
    res.body.valutations.should.be.a('array').with.lengthOf(1);
    res.body.valutations[0].rate.should.be.eql(5);
  })
})
