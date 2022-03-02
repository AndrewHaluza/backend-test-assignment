import { SubscriptionEnum } from "./enums/subscription.enum";
import { TopicEnum } from "./enums/topic.enum";

const { PubSub } = require("@google-cloud/pubsub");
const bunyan = require("bunyan");

const serviceAccount = require("./credentials");

module.exports = class PubSubInitializer {
  private pubsub: any;

  private topic: any;

  private logger: any;

  private subscriptions: any = {};

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.logger = bunyan.createLogger({ name: "PubSubInitializer" });
    this.pubsub = new PubSub({ projectId: serviceAccount.project_id });

    await this.findOrCreateTopic(TopicEnum.parseCsv);
    await this.findOrCreateSubscription(SubscriptionEnum.parsedRow);
  }

  private async findOrCreateTopic(name: TopicEnum) {
    try {
      await this.pubsub.createTopic(name);
    } catch (error) {
      if (error.code === 6) {
        // skip if already exists
      } else {
        this.logger.error(error);
      }
    }

    this.topic = this.pubsub.topic(name);
  }

  private async findOrCreateSubscription(name: SubscriptionEnum) {
    try {
      await this.topic.createSubscription(name);
    } catch (error) {
      if (error.code === 6) {
        // skip if already exists
      } else {
        this.logger.error(error);
      }
    }

    this.subscriptions[name] = this.topic.subscription(name);
  }
};
