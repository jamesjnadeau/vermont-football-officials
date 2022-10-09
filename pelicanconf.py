AUTHOR = 'James Nadeau'
SITENAME = 'Vermont Football Officials'
SITEURL = ''

PATH = 'content'

TIMEZONE = 'America/New_York'

DEFAULT_LANG = 'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
LINKS = (# ('Pelican', 'https://getpelican.com/'),
         # ('Python.org', 'https://www.python.org/'),
         # ('Jinja2', 'https://palletsprojects.com/p/jinja/'),
        #  ('You can modify those links in your config file', '#'),
        )

# Social widget
SOCIAL = (# ('You can add links in your config file', '#'),
          # ('Another social link', '#'),
          )

DEFAULT_PAGINATION = 10
USE_FOLDER_AS_CATEGORY = True

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True

DISPLAY_CATEGORIES_ON_MENU = False

STATIC_PATHS = ['admin', 'uploads']

THEME = 'theme'
DISPLAY_CATEGORIES_ON_MENU=True
DISPLAY_PAGES_ON_MENU=False
ARTICLE_EXCLUDES = ["admin"] # makes it so the index.html file works