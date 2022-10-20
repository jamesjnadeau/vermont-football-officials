
//  = require('../utilities/db.js')
import { client } from './utilities/db.mjs'



// https://docs.netlify.com/functions/build/
export async function handler(event, context) {
    await client.connect()
    let response = await client.query('SELECT * FROM "public"."Users"');
    let users = response.rows;
    return {
      statusCode: 200,
      body: JSON.stringify({
        total: users.length,
        rows: users,
      }),
    };
  }