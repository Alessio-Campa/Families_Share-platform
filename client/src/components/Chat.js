import React from "react";
import PropTypes from "prop-types";
import BackNavigation from "./BackNavigation";
import { GroupMessages } from "./Messages";

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
  const { group, userIsAdmin } = props;
  const messages = (
    <EventChat groupId={group.group_id} userIsAdmin={userIsAdmin} />
  );
  AbstractChat(props, messages, group.name);
};

export default GroupChat;

AbstractChat.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  group: PropTypes.object,
  // eslint-disable-next-line react/no-unused-prop-types
  userIsAdmin: PropTypes.bool,
  history: PropTypes.object,
};

GroupChat.propTypes = {
  group: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  history: PropTypes.object,
};
