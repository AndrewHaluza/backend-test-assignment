import { pubsub } from "firebase-functions";
import { Message } from "firebase-functions/v1/pubsub";
import parsePhoneNumber from "libphonenumber-js";

import { CollectionEnum } from "../enums/collection.enum";
import { TopicEnum } from "../enums/topic.enum";
import IParsedRowMessage from "../interfaces/IParsedRowMessage";

const { Firestore } = require("@google-cloud/firestore");

const db = new Firestore();

module.exports = pubsub
  .topic(TopicEnum.parseCsv)
  .onPublish(async (message: Message) => {
    const messageBody: IParsedRowMessage = message.data
      ? JSON.parse(Buffer.from(message.data, "base64").toString())
      : null;

    if (!messageBody) {
      return;
    }

    const { fileId, elementId, phone } = messageBody;
    const normalizedPhone = parsePhoneNumber(phone);
    const phoneValid = normalizedPhone?.isValid() || false;
    const parentKey = `${CollectionEnum.files}/${fileId}`;
    const childKey = `${parentKey}/${CollectionEnum.filesElements}/${elementId}`;

    await db.doc(childKey).update({
      phoneValid,
      updatedAt: new Date(),
    });

    await db.doc(parentKey).update({
      processed: Firestore.FieldValue.increment(1),
    });
  });
