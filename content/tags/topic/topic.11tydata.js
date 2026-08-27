// Directory data for the generated topic pages.
//
// topic.pug paginates one page per entry in content/_data/topics.json, so its
// URL, <title> and meta description all depend on which topic it landed on.
// Pug front matter is YAML and can't compute those, so they're computed here.
export default {
  eleventyComputed: {
    permalink: (data) => `/tags/${data.topic.slug}/`,
    title: (data) => `${data.topic.name} | Vermont Football Officials`,
    description: (data) => data.topic.description,
  },
};
