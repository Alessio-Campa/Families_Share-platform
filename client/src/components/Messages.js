import React from "react";
import PropTypes from "prop-types";
import axios from "axios";
import LazyLoad from "react-lazyload";
import AnnouncementBar from "./AnnouncementBar";
import AnnouncementHeader from "./AnnouncementHeader";
import AnnouncementMain from "./AnnouncementMain";
import AnnouncementReplies from "./AnnouncementReplies";
import LoadingSpinner from "./LoadingSpinner";
import Log from "./Log";

class AbstractMessages extends React.Component {
  state = { fetchedAnnouncements: false };

  componentDidMount() {
    axios
      .get(this.getAnnouncementsUrl())
      .then((response) => {
        const announcements = response.data;
        this.setState({
          fetchedAnnouncements: true,
          announcements,
        });
      })
      .catch((error) => {
        Log.error(error);
        this.setState({ fetchedAnnouncements: true, announcements: [] });
      });
  }

  // eslint-disable-next-line class-methods-use-this
  getAnnouncementsUrl() {
    throw new Error("Method not implemented.");
  }

  refresh = () => {
    axios
      .get(this.getAnnouncementsUrl())
      .then(async (response) => {
        const announcements = response.data;
        await this.setState({
          announcements,
        });
        await this.announcementsStart.scrollIntoView({ behavior: "smooth" });
      })
      .catch((error) => {
        Log.error(error);
      });
  };

  renderAnnouncements = () => {
    const { announcements } = this.state;
    const { userIsAdmin } = this.props;
    const { length } = announcements;
    const blocks = [...Array(Math.ceil(length / 2)).keys()];
    return (
      <ul>
        {blocks.map((block) => {
          let indexes;
          if (length <= 2) {
            indexes = [...Array(length).keys()];
          } else {
            indexes = [
              ...Array(
                (block + 1) * 2 <= length ? 2 : length - block * 2
              ).keys(),
            ].map((x) => block * 2 + x);
          }
          return (
            <LazyLoad height={450} once offset={100}>
              {indexes.map((index) => (
                <li
                  style={{ padding: "2rem 0" }}
                  key={index}
                  ref={(ref) => {
                    if (index === 0) {
                      this.announcementsStart = ref;
                    }
                  }}
                >
                  <div id="announcementContainer" className="horizontalCenter">
                    <AnnouncementHeader
                      announcementsUrl={this.getAnnouncementsUrl()}
                      userId={announcements[index].user_id}
                      createdAt={announcements[index].createdAt}
                      userIsAdmin={userIsAdmin}
                      handleRefresh={this.refresh}
                      announcementId={announcements[index].announcement_id}
                    />
                    <AnnouncementMain
                      message={announcements[index].body}
                      images={announcements[index].images}
                    />
                    <AnnouncementReplies
                      announcementId={announcements[index].announcement_id}
                      userIsAdmin={userIsAdmin}
                      announcementsUrl={this.getAnnouncementsUrl()}
                    />
                  </div>
                </li>
              ))}
            </LazyLoad>
          );
        })}
      </ul>
    );
  };

  render() {
    const { fetchedAnnouncements } = this.state;
    return (
      <div id="announcementsContainer">
        {fetchedAnnouncements ? this.renderAnnouncements() : <LoadingSpinner />}
        <AnnouncementBar
          announcementsUrl={this.getAnnouncementsUrl()}
          handleRefresh={this.refresh}
        />
      </div>
    );
  }
}

class GroupMessages extends AbstractMessages {
  getAnnouncementsUrl() {
    const { groupId } = this.props;
    return `/api/groups/${groupId}/announcements`;
  }
}

class EventMessages extends AbstractMessages {
  getAnnouncementsUrl() {
    const { groupId, eventId } = this.props;
    return `/api/groups/${groupId}/events/${eventId}/announcements`;
  }
}

export { GroupMessages, EventMessages };

AbstractMessages.propTypes = {
  userIsAdmin: PropTypes.bool,
};

GroupMessages.propTypes = {
  groupId: PropTypes.string,
  userIsAdmin: PropTypes.bool,
};

EventMessages.propTypes = {
  groupId: PropTypes.string,
  eventId: PropTypes.string,
  userIsAdmin: PropTypes.bool,
};
