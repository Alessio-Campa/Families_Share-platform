const common = require("../common");

const { server } = common;
const { chai } = common;

const User = require("../../src/models/user");
const Group = require("../../src/models/group");
const Survey = require("../../src/models/survey");

describe("/Post/api/groups/id/survey", () => {
  it("it should not post a new survey when user is not authenticated", (done) => {
    User.findOne({ email: "my_user@email.com" }, (error, user) => {
      Group.findOne({ name: "Gruppo" }, (err, group) => {
        const name = "Survey di test";
        const location = "Testing park";
        const color = "#00838F";
        const multipleChoiceAllowed = false;
        const possibilities = [
          {
            date: "2022-03-06",
            startTime: "21:00",
            endTime: "22:00",
            votes: [],
          },
          {
            date: "2022-03-06",
            startTime: "20:00",
            endTime: "21:00",
            votes: [],
          },
        ];
        chai
          .request(server)
          .post(`/api/groups/${group.group_id}/survey`)
          .set("Authorization", "invalidtoken")
          .send({ name, location, color, possibilities, multipleChoiceAllowed })
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });
  });
});

describe("/Post/api/groups/id/survey", () => {
  it("it should not post a new survey when user is not group member", (done) => {
    User.findOne({ email: "test2@notInGroup.com" }, (error, user) => {
      Group.findOne({ name: "Gruppo" }, (err, group) => {
        const name = "Survey di test";
        const location = "Testing park";
        const color = "#00838F";
        const multipleChoiceAllowed = false;
        const possibilities = [
          {
            date: "2022-03-06",
            startTime: "21:00",
            endTime: "22:00",
            votes: [],
          },
          {
            date: "2022-03-06",
            startTime: "20:00",
            endTime: "21:00",
            votes: [],
          },
        ];
        chai
          .request(server)
          .post(`/api/groups/${group.group_id}/survey`)
          .set("Authorization", user.token)
          .send({ name, location, color, possibilities, multipleChoiceAllowed })
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });
  });
});

describe("/Post/api/groups/id/survey", () => {
  it("it should not post a new survey (location is empty)", (done) => {
    User.findOne({ email: "my_user@email.com" }, (error, user) => {
      Group.findOne({ name: "Gruppo" }, (err, group) => {
        const name = "Survey di test";
        const location = false;
        const color = "#00838F";
        const multipleChoiceAllowed = false;
        const possibilities = [
          {
            date: "2022-03-06",
            startTime: "21:00",
            endTime: "22:00",
            votes: [],
          },
          {
            date: "2022-03-06",
            startTime: "20:00",
            endTime: "21:00",
            votes: [],
          },
        ];
        chai
          .request(server)
          .post(`/api/groups/${group.group_id}/survey`)
          .set("Authorization", user.token)
          .send({ name, location, color, possibilities, multipleChoiceAllowed })
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
      });
    });
  });
});

describe("/Post/api/groups/id/survey", () => {
  it("it should post a new survey when user is authenticated and group member", (done) => {
    User.findOne({ email: "my_user@email.com" }, (error, user) => {
      Group.findOne({ name: "Gruppo" }, (err, group) => {
        const name = "Survey di test";
        const location = "Testing park";
        const color = "#00838F";
        const multipleChoiceAllowed = false;
        const possibilities = [
          {
            date: "2022-03-06",
            startTime: "21:00",
            endTime: "22:00",
            votes: [],
          },
          {
            date: "2022-03-06",
            startTime: "20:00",
            endTime: "21:00",
            votes: [],
          },
        ];
        chai
          .request(server)
          .post(`/api/groups/${group.group_id}/survey`)
          .set("Authorization", user.token)
          .send({ name, location, color, possibilities, multipleChoiceAllowed })
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
  });
});

describe("/Get/api/groups/groupId/survey/surveyId/", () => {
  it("it should fetch a survey when user is authenticated and group member", async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", user.token);
    res.should.have.status(200);
    res.body.should.be.a("object");
  });
});

describe("/Get/api/groups/groupId/survey/surveyId/", () => {
  it("it should not fetch a survey when user isnt authenticated", async () => {
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", "invalidToken");
    res.should.have.status(401);
  });
});

describe("/Get/api/groups/groupId/survey/surveyId/", () => {
  it("it should not fetch a survey when user isnt group member", async () => {
    const user = await User.findOne({ email: "test2@notInGroup.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", user.token);
    res.should.have.status(401);
  });
});

describe("/Get/api/groups/groupId/surveys", () => {
  it("it should fetch surveys when user is authenticated and group member", async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/`)
      .set("Authorization", user.token);
    res.should.have.status(200);
    res.body.should.be.a("array").with.lengthOf(1);
  });
});

describe("/Get/api/groups/groupId/survey/surveyId/", () => {
  it("it should not fetch surveys when user isnt authenticated", async () => {
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/`)
      .set("Authorization", "invalidToken");
    res.should.have.status(401);
  });
});

describe("/Get/api/groups/groupId/survey/surveyId/", () => {
  it("it should not fetch surveys when user isnt group member", async () => {
    const user = await User.findOne({ email: "test2@notInGroup.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .get(`/api/groups/${survey.group_id}/surveys/`)
      .set("Authorization", user.token);
    res.should.have.status(401);
  });
});

describe("/Patch/api/groups/groupId/surveys/surveyId/", () => {
  it("it should not insert/delete a vote when user isnt authenticated", async () => {
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .patch(
        `/api/groups/${survey.group_id}/surveys/${survey.survey_id}/votes/${survey.possibilities[0].possibility_id}`
      )
      .set("Authorization", "invalidtoken");
    res.should.have.status(401);
  });
});

describe("/Patch/api/groups/groupId/surveys/surveyId/", () => {
  it("it should not insert/delete a vote when user isnt group member", async () => {
    const user = await User.findOne({ email: "test2@notInGroup.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .patch(
        `/api/groups/${survey.group_id}/surveys/${survey.survey_id}/votes/${survey.possibilities[0].possibility_id}`
      )
      .set("Authorization", user.token);
    res.should.have.status(401);
  });
});

describe("/Patch/api/groups/groupId/surveys/surveyId/", () => {
  it("it should insert a vote when user is authenticated and member", async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .patch(
        `/api/groups/${survey.group_id}/surveys/${survey.survey_id}/votes/${survey.possibilities[0].possibility_id}`
      )
      .set("Authorization", user.token);
    res.should.have.status(200);
  });
});

describe("/Patch/api/groups/groupId/surveys/surveyId/", () => {
  it("it should delete a vote when user is authenticated and member", async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .patch(
        `/api/groups/${survey.group_id}/surveys/${survey.survey_id}/votes/${survey.possibilities[0].possibility_id}`
      )
      .set("Authorization", user.token);
    res.should.have.status(200);
  });
});

describe("/Delete/api/groups/groupId/surveys/surveyId/", () => {
  it("it should not delete a survey when user isnt authenticated", async () => {
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .delete(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", "invalidtoken");
    res.should.have.status(401);
  });
});

describe("/Delete/api/groups/groupId/surveys/surveyId/", () => {
  it("it should not delete a survey when user isnt creator or member", async () => {
    const user = await User.findOne({ email: "test2@notInGroup.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .delete(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", user.token);
    res.should.have.status(401);
  });
});

describe("/Delete/api/groups/groupId/surveys/surveyId/", () => {
  it("it should delete a survey when user is authenticated, member and creator", async () => {
    const user = await User.findOne({ email: "my_user@email.com" });
    const survey = await Survey.findOne({ name: "Survey di test" });
    const res = await chai
      .request(server)
      .delete(`/api/groups/${survey.group_id}/surveys/${survey.survey_id}/`)
      .set("Authorization", user.token);
    res.should.have.status(200);
  });
});
