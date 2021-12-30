const common = require('../common');

const { server } = common;
const { chai } = common;

const User = require('../../src/models/user');
const Group = require('../../src/models/group');
const Announcement = require('../../src/models/announcement');
const Reply = require('../../src/models/reply');
const Activity = require('../../src/models/activity');

describe('/Post/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should post a new activity announcement when user is authenticated and group member', (done) => {
		User.findOne({ email: "my_user@email.com"}, (err, user) => {
			Activity.findOne({ name: "Attivita"}, (err, activity) => {
				const announcement = {
					message: "Test Announcement"
				};
				chai.request(server)
					.post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
					.set('Authorization',user.token)
					.send(announcement)
					.end( (err, res) => {
						res.should.have.status(200);
						done();
					});
			});
		});
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not post a new activity announcement when user isnt authenticated', (done) => {
		Activity.findOne({ name: "Attivita"}, (err, activity) => {
			const announcement = {
				message: "Test Announcement"
			};
			chai.request(server)
				.post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
				.set('Authorization', 'invalidtoken')
				.send(announcement)
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not post a new activity announcement when user isnt group member', (done) => {
		User.findOne({ email: "test2@email.com" }, (err, user) => {
			Activity.findOne({ name: "Attivita"}, (err, activity) => {
				const announcement = {
					message: "Test Announcement"
				};
				chai.request(server)
					.post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
					.set('Authorization', user.token)
					.send(announcement)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});
		});
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not post a new activity announcement with incorrect parameters', (done) => {
		User.findOne({ email: "my_user@email.com" }, (err, user) => {
			Activity.findOne({ name: "Attivita"}, (err, activity) => {
				const announcement = {
					foo: "bar"
				};
				chai.request(server)
					.post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
					.set('Authorization', user.token)
					.send(announcement)
					.end((err, res) => {
						res.should.have.status(400);
						done();
					});
			});
		});
	});
});
describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId', () => {
	it('it should not delete an activity announcement when user isnt authenticated', async () => {
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id });
		const res = await chai.request(server)
			.delete(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements/${announcement.announcement_id}`)
			.set('Authorization', 'invalid_id')
		res.should.have.status(401);
	});
});
describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId', () => {
	it('it should not delete an activity announcementt when user isnt group admin or creator', async () => {
		const user = await User.findOne({ email: "test2@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id });
		const res = await chai.request(server)
			.delete(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements/${announcement.announcement_id}`)
			.set('Authorization', user.token)
		res.should.have.status(401);
	});
});
describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId', () => {
	it('it should delete an activity announcement when user is authenticated and admin or creator', async () => {
		const user = await User.findOne({ email: "my_user@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id });
		const res = await chai.request(server)
			.delete(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements/${announcement.announcement_id}`)
			.set('Authorization', user.token)
		res.should.have.status(200);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should fetch an activity announcements when user is authenticated and group member', async () => {
		const user = await User.findOne({ email: "my_user@email.com" });
		const activity = await Activity.findOne({ name: "Attivita"});
		//Send a new message
		await chai.request(server).post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
			.set('Authorization',user.token).send({ message: "Nuovo messaggio" })

		const res = await chai.request(server)
			.get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
			.set('Authorization', user.token);
		res.should.have.status(200);
		res.body.should.be.a('array').with.lengthOf(1);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not fetch an activity announcements when user isnt authenticated ', (done) => {
		Activity.findOne({ name: "Attivita"}, (err, activity) => {
			chai.request(server)
				.get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
				.set('Authorization', 'invalidtoken')
				.end((err, res) => {
					res.should.have.status(401);
					done();
				});
		});
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not fetch an activity announcements when user isnt group member', (done) => {
		User.findOne({ email: "test2@email.com" }, (err, user) => {
			Activity.findOne({ name: "Attivita"}, (err, activity) => {
				chai.request(server)
					.get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
					.set('Authorization', user.token)
					.end((err, res) => {
						res.should.have.status(401);
						done();
					});
			});
		});
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements', () => {
	it('it should not fetch an activity announcements when it has none', async () => {
		await Announcement.deleteMany({})

		const user = await User.findOne({ email: "my_user@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})

		const res = await chai.request(server)
			.get(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
			.set('Authorization', user.token)
		res.should.have.status(404);
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements/announcementId/replies', async () => {
	it('it should post a new reply when user is authenticated and group member', async () => {
		const user = await User.findOne({ email: "my_user@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})

		//Send a new message
		await chai.request(server).post(`/api/groups/${activity.group_id}/activities/${activity.activity_id}/announcements`)
			.set('Authorization',user.token).send({ message: "Nuovo messaggio" })

		const announcement = await Announcement.findOne({ activity_id: activity.activity_id });
		const reply = {
			message: "Test Reply"
		};
		const res = await chai.request(server)
			.post(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
			.send(reply)
		res.should.have.status(200);
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements/announcementId/replies', async () => {
	it('it should not post a new reply announcement when user isnt authenticated ', async () => {
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })

		const reply = {
			message: "Test Reply"
		};
		const res = await chai.request(server)
			.post(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', 'invalidtoken')
			.send(reply)
		res.should.have.status(401);
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements/announcementId/replies', async () => {
	it('it should not post a new reply when user isnt group member', async () => {
		const user = await User.findOne({ email: "test2@email.com" });
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const reply = {
			message: "Test Reply"
		};
		const res = await chai.request(server)
			.post(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
			.send(reply)
		res.should.have.status(401);
	});
});
describe('/Post/api/groups/groupId/activities/activityId/announcements/announcementId/replies', async () => {
	it('it should not post a new reply when some parameters are missing', async () => {
		const user = await User.findOne({ email: "my_user@email.com" });
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const reply = {
			foo: "Bar"
		};
		const res = await chai.request(server)
			.post(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
			.send(reply)
		res.should.have.status(400);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements/announcementId/replies', () => {
	it('it should fetch an announcements replies when user is authenticated and group member', async () => {
		const user = await User.findOne({ email: "my_user@email.com" });
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })

		const res = await chai.request(server)
			.get(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
		res.should.have.status(200);
		res.body.should.be.a('array').with.lengthOf(1);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements/announcementId/replies', () => {
	it('it should not fetch an announcements replies when user isnt authenticated', async () => {
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const res = await chai.request(server)
			.get(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', 'invalidtoken')
		res.should.have.status(401);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements/announcementId/replies', () => {
	it('it should not fetch an announcements replies when user isnt group member', async () => {
		const user = await User.findOne({ email: "test2@email.com" });
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const res = await chai.request(server)
			.get(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
		res.should.have.status(401);
	});
});

describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId/replies/replyId', () => {
	it('it should not delete an announcements reply when user isnt authenticated', async () => {
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const reply = await Reply.findOne({ announcement_id: announcement.announcement_id});
		const res = await chai.request(server)
			.delete(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies/${reply.reply_id}`)
			.set('Authorization', 'invalidtoken')
		res.should.have.status(401);
	});
});

describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId/replies/replyId', () => {
	it('it should not delete an announcements reply when user isnt admin or creator ', async () => {
		const user = await User.findOne({ email: "test2@email.com"});
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const reply = await Reply.findOne({ announcement_id: announcement.announcement_id});
		const res = await chai.request(server)
			.delete(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies/${reply.reply_id}`)
			.set('Authorization', user.token)
		res.should.have.status(401);
	});
});
describe('/Delete/api/groups/groupId/activities/activityId/announcements/announcementId/replies/replyId', () => {
	it('it should delete an announcements reply when user is authenticated and admin or creator', async () => {
		const user = await User.findOne({ email: "my_user@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const reply = await Reply.findOne({ announcement_id: announcement.announcement_id});
		const res = await chai.request(server)
			.delete(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies/${reply.reply_id}`)
			.set('Authorization', user.token)
		res.should.have.status(200);
	});
});
describe('/Get/api/groups/groupId/activities/activityId/announcements/announcementId/replies', () => {
	it('it should not fetch an announcements replies when user it has none', async () => {
		const user = await User.findOne({ email: "my_user@email.com" })
		const activity = await Activity.findOne({ name: "Attivita"})
		const announcement = await Announcement.findOne({ activity_id: activity.activity_id })
		const res = await chai.request(server)
			.get(`/api/groups/${announcement.group_id}/activities/${announcement.activity_id}/announcements/${announcement.announcement_id}/replies`)
			.set('Authorization', user.token)
		res.should.have.status(404);
	});
});
