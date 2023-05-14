import { Session, AuthHandler, GoogleAdapter } from "sst/node/auth";
import { Table } from "sst/node/table";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      userID: string;
    };
  }
}

export const handler = AuthHandler({
  providers: {
    google: GoogleAdapter({
      mode: "oidc",
      clientID: "85203977808-e3k1hb0dv8pf2e7pighn59li87atqus1.apps.googleusercontent.com",
      onSuccess: async (tokenset) => {
        const claims = tokenset.claims();

        const ddb = new DynamoDBClient({});
        await ddb.send(
          new PutItemCommand({
            //@ts-ignore
            TableName: Table.users.tableName,
            Item: marshall({
              userId: claims.sub,
              email: claims.email,
              picture: claims.picture,
              name: claims.given_name,
            }),
          })
        );

        return Session.parameter({
          //@ts-ignore
          redirect: "http://localhost:3000",
          type: "user",
          properties: {
            userID: claims.sub,
          },
        });
      },
    }),
  },
});