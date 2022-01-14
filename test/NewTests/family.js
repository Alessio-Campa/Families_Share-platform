const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Group = require('../../src/models/group')
const Activity = require('../../src/models/activity')
const Notification = require('../../src/models/notification')

describe('/Post/api/family', () => {
  it('It should create a new family', async () => {
    const creator = await User.findOne({ email: 'test2@email.com' });
    const res = await chai.request(server)
      .post(`/api/family/`)
      .set('Authorization', creator.token)
      .send({familyName: 'testFamily', role: 'father'})
    res.should.have.status(200);
  })
})

describe('/Get/api/family', () => {
  it('It should get the family', async () => {
    const creator = await User.findOne({ email: 'test2@email.com' });
    const res = await chai.request(server)
      .get(`/api/family/user/${creator.user_id}`)
      .set('Authorization', creator.token)
    res.should.have.status(200);
    res.body.should.have.lengthOf(1)
  })
})

describe('/Get/api/family', () => {
  it('It shouldn\'t get any family', async () => {
    const creator = await User.findOne({ email: 'test3@email.com' });
    const res = await chai.request(server)
      .get(`/api/family/user/${creator.user_id}`)
      .set('Authorization', creator.token)
    res.should.have.status(200);
    res.body.should.have.lengthOf(0)
  })
})

describe('/Put/api/family', () => {
  it('It should add the user to the family', async () => {
    const creator = await User.findOne({ email: 'test2@email.com' });
    const newMember = await User.findOne({ email: 'test3@email.com' });
    const family = await chai.request(server)
      .get(`/api/family/user/${creator.user_id}`)
      .set('Authorization', creator.token)

    const res = await chai.request(server)
      .put(`/api/family/${family.body[0].id}`)
      .set('Authorization', creator.token)
      .send({memberId: newMember.user_id, role: 'mother'})
    res.should.have.status(200);
    res.text.should.equal('Family updated correctly')
  })
})