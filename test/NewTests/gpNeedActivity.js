const common = require('../common')

const { server } = common
const { chai } = common

const User = require('../../src/models/user')
const Group = require('../../src/models/group')
const Activity = require('../../src/models/activity')

describe('/Post/api/groups/id/activities', () => {
  it('it should post a new activity with Green pass needed', done => {
    User.findOne({ email: 'my_user@email.com' }, (error, user) => {
      Group.findOne({ name: 'Gruppo' }, (err, group) => {
        const activity = {
          group_id: group.group_id,
          creator_id: user.user_id,
          name: 'Test Activity Green Pass',
          color: '#00838F',
          description: 'test',
          location: 'Kuala lumpur',
          repetition: false,
          repetition_type: "",
          different_timeslots: false,
          gp_need: true,
        }
        const events = [
          {
            description: 'Test timeslot',
            location: 'Kuala lumpur',
            summary: 'Test timeslot',
            start: {
              dateTime: '2019-03-06T22:00:00.000Z',
              date: null
            },
            end: {
              dateTime: '2019-03-06T23:00:00.000Z',
              date: null
            },
            extendedProperties: {
              shared: {
                requiredParents: 4,
                requiredChildren: 10,
                cost: 0,
                parents: JSON.stringify([]),
                children: JSON.stringify([]),
                status: 'ongoing',
                activityColor: '#00838F',
                groupId: group.group_id,
                repetition: 'none'
              }
            }
          }
        ]
        chai
          .request(server)
          .post(`/api/groups/${group.group_id}/activities`)
          .set('Authorization', user.token)
          .send({ activity, events })
          .end((err, res) => {
            //Created
            res.should.have.status(200)

            Activity.findOne({ name: 'Test Activity Green Pass' }, (err, activity) => {
              chai
                .request(server)
                .get(`/api/groups/${group.group_id}/activities/${activity.activity_id}`)
                .set('Authorization', user.token)
                .end((err, res) => {
                  //Readed
                  res.should.have.status(200)
                  res.body.gp_need.should.be.eql(true)
                  done()
                })
            })
          })
      })
    })
  })
})
