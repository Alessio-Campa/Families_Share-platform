const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Group = require('../../src/models/group')
const Activity = require('../../src/models/activity')
const Notification = require('../../src/models/notification')

///:receiverId/positivityNotification/:senderId
describe('/Post/api/users/receiverId/positivityNotification/senderId', () => {
  it('It should not add a new notification user not logged', async () => {
    const sender = await User.findOne({ email: "my_user@email.com" });
    const receiver = await User.findOne({ email: "test2@notInGroup.com" })
    const res = await chai.request(server)
      .post(`/api/users/${receiver.user_id}/positivityNotification/${sender.activity_id}`)
      .set('Authorization', 'invalidtoken')
    res.should.have.status(401);
  })
})

describe('/Post/api/users/receiverId/positivityNotification/senderId', () => {
  it('It should not add a new notification, user logged with another account', async () => {
    const sender = await User.findOne({ email: "my_user@email.com" });
    const receiver = await User.findOne({ email: "test2@notInGroup.com" })
    const res = await chai.request(server)
      .post(`/api/users/${receiver.user_id}/positivityNotification/${sender.activity_id}`)
      .set('Authorization', receiver.token)
    res.should.have.status(401);
  })
})

describe('/Post/api/users/receiverId/positivityNotification/senderId', () => {
  it('It should add a new notification', async () => {
    const sender = await User.findOne({ email: "my_user@email.com" });
    const receiver = await User.findOne({ email: "test2@notInGroup.com" })
    const res = await chai.request(server)
      .post(`/api/users/${receiver.user_id}/positivityNotification/${sender.activity_id}`)
      .set('Authorization', sender.token)
    res.should.have.status(401);
  })
})
