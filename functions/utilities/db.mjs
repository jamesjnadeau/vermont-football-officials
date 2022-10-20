
import { Client } from "pg";

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // application_name: "$ docs_quickstart_node"
});

// will need to run this after import
// await client.connect()

export { client };