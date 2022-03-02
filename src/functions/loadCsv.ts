import { resolve } from "path";
import { createReadStream } from "fs";
import * as functions from "firebase-functions";
import { Request, Response } from "express";

import { TopicEnum } from "../enums/topic.enum";
import { CollectionEnum } from "../enums/collection.enum";
import IParsedRow from "../interfaces/IParsedRow";
import IParsedRowMessage from "../interfaces/IParsedRowMessage";

const parse = require("csv-parse");
const { v4: uuidv4 } = require("uuid");
const { PubSub } = require("@google-cloud/pubsub");
const { Firestore } = require("@google-cloud/firestore");

const serviceAccount = require("../credentials");

const db = new Firestore();
const pubsub = new PubSub({
  projectId: serviceAccount.project_id,
});

module.exports = functions
  .runWith({
    maxInstances: 1,
  })
  .https.onRequest(async (req: Request, res: Response) => {
    try {
      const fileName = "example.csv";
      const filePath = resolve(process.cwd(), fileName);
      const readStream = createReadStream(filePath);
      const fileId: string = uuidv4();
      const fileRef = db.doc(`${CollectionEnum.files}/${fileId}`);
      const topic = pubsub.topic(TopicEnum.parseCsv);
      const tasks: Promise<any>[] = [];
      const now = new Date();
      let counter = 0;
      let headers: boolean;

      await fileRef.set({
        fileName,
        totalCount: counter,
        createdAt: now,
      });

      readStream
        .pipe(
          parse({
            delimiter: ",",
            bom: true,
            skip_lines_with_error: true,
          })
        )
        .on("data", async ([name, email, phone]: string[]) => {
          if (!headers) {
            headers = true;

            return;
          }

          tasks.push(
            (() => {
              const elementId: string = uuidv4();
              const elementRef = db.doc(
                `${CollectionEnum.files}/${fileId}/${CollectionEnum.filesElements}/${elementId}`
              );
              const data: IParsedRow = {
                name,
                email,
                phone,
                phoneValid: false,
                createdAt: now,
                updatedAt: now,
              };
              const publishMessage = Buffer.from(
                JSON.stringify({
                  elementId,
                  fileId,
                  ...data,
                } as IParsedRowMessage),
                "utf8"
              );

              return Promise.all([
                topic.publish(publishMessage),
                elementRef.set(data),
              ]);
            })()
          );

          counter++;
        });

      readStream.on("close", async () => {
        await fileRef.update({
          totalCount: counter,
        });
        await Promise.all(tasks);

        res.status(200).send("Saved");
      });
    } catch (error) {
      throw error;
    }
  });
