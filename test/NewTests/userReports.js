const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Group = require('../../src/models/group')
const { forEach } = require('mongoose/lib/statemachine')
// const Member = require('../../src/models/member')

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should not add a new report, reporter not logged', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reported = await User.findOne({ email: "my_user2@email.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', 'invalidtoken')
      .send({ message: "Report d'esempio" })
    res.should.have.status(401);
  })
})

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should not add a new report, reporter not part of the group', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reporter = await User.findOne({ email: "test2@notInGroup.com" });
    const reported = await User.findOne({ email: "my_user2@email.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', reporter.token)
      .send({ message: "Report d'esempio" })
    res.should.have.status(401);
  })
})

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should not add a new report, reported not part of the group', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reporter = await User.findOne({ email: "my_user@email.com" });
    const reported = await User.findOne({ email: "test2@notInGroup.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', reporter.token)
      .send({ message: "Report d'esempio" })
    res.should.have.status(404);
  })
})

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should add a new report, user on admin', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reporter = await User.findOne({ email: "my_user2@email.com" });
    const reported = await User.findOne({ email: "my_user@email.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', reporter.token)
      .send({ message: "Report avvenuto con successo" })
    res.should.have.status(200);
  })
})

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should add a new report, admin on user', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reporter = await User.findOne({ email: "my_user@email.com" });
    const reported = await User.findOne({ email: "my_user2@email.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', reporter.token)
      .send({ message: "Report avvenuto con successo (admin on user)" })
    res.should.have.status(200);
  })
})

describe('/Put/api/groups/groupId/members/memberId/report', () => {
  it('It should not add a new report, cool-down time not passed (24h needed)', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const reporter = await User.findOne({ email: "my_user2@email.com" });
    const reported = await User.findOne({ email: "my_user@email.com" })
    const res = await chai.request(server)
      .put(`/api/groups/${group.group_id}/members/${reported.user_id}/report`)
      .set('Authorization', reporter.token)
      .send({ message: "Report d'esempio" })
    res.should.have.status(400);
  })
})

describe('/Get/api/groups/groupId/members', () => {
  it('It should get the reports about others, not himself', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const admin = await User.findOne({ email: "my_user@email.com" })
    const user = await User.findOne({ email: "my_user2@email.com" })
    const res = await chai.request(server)
      .get(`/api/groups/${group.group_id}/members`)
      .set('Authorization', admin.token)
    res.should.have.status(200);
    for(let i in res.body)
    {
      if(res.body[i].user_id === admin.user_id)
        res.body[i].should.not.have.property('reports')

      if(res.body[i].user_id === user.user_id)
      {
        res.body[i].should.have.property('reports')
        res.body[i].reports.should.be.a('array').with.lengthOf(1);
        res.body[i].reports[0].message.should.be.eql('Report avvenuto con successo (admin on user)');
      }
    }
  })
})

describe('/Get/api/groups/groupId/members', () => {
  it('It should not get the reports, user is not admin', async () => {
    const group = await Group.findOne({ name: "Gruppo" })
    const admin = await User.findOne({ email: "my_user2@email.com" })
    const res = await chai.request(server)
      .get(`/api/groups/${group.group_id}/members`)
      .set('Authorization', admin.token)
    res.should.have.status(200);
    for(let i in res.body)
    {
        res.body[i].should.not.have.property('reports')
    }
  })
})
