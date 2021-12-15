import React from "react";
import PropTypes from "prop-types";
import BackNavigation from "./BackNavigation";
import { EventMessages, GroupMessages } from "./Messages";

const AbstractChat = (props, messages, title) => {
  const { history } = props;
  const handleGoBack = () => {
    if (history.length === 1) {
      history.replace("/myfamiliesshare");
    } else {
      history.goBack();
    }
  };
  return (
    <React.Fragment>
      <BackNavigation title={title} fixed onClick={() => handleGoBack()} />
      {messages}
    </React.Fragment>
  );
};

const GroupChat = (props) => {
  const { group, userIsAdmin } = props;
  const messages = (
    <GroupMessages groupId={group.group_id} userIsAdmin={userIsAdmin} />
  );
  return AbstractChat(props, messages, group.name);
};

const EventChat = (props) => {
  const { group_id, event_id, userIsAdmin, title } = props;
  const messages = (
    <EventMessages
      groupId={group_id}
      eventId={event_id}
      userIsAdmin={userIsAdmin}
    />
  );
  return AbstractChat(props, messages, title);
};

export { GroupChat, EventChat };

AbstractChat.propTypes = {
  history: PropTypes.object,
};

GroupChat.propTypes = {
  group: PropTypes.string,
  userIsAdmin: PropTypes.bool,
  history: PropTypes.object,
};

EventChat.propTypes = {
  group_id: PropTypes.string,
  event_id: PropTypes.string,
  title: PropTypes.string,
  userIsAdmin: PropTypes.bool,
  history: PropTypes.object,
};
