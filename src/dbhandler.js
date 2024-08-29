class Database {
  constructor() {
    this.users = {};
  }

  getOrCreateUser({ PhoneNumber, ProfileName }) {
    if (!this.users[PhoneNumber]) {
      this.users[PhoneNumber] = {
        ProfileName: ProfileName,
        PhoneNumber: PhoneNumber,
        Messages: [],
      };
    }
    return this.users[PhoneNumber];
  }

  storeMessageForUser({ PhoneNumber, message, customerMessage }) {
    this.users[PhoneNumber].Messages.push({
      message: message,
      time: Date.now(),
      customerMessage: customerMessage,
    });
  }

  getMessagesForUser({ PhoneNumber }) {
    return this.users[PhoneNumber];
  }

  aiMessageLogs({ PhoneNumber }) {
    return this.users[PhoneNumber]?.Messages;
  }
}

export default Database;
