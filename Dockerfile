FROM node:lts-alpine

ADD package.json /
RUN npm i

ENV TOKEN=

ENV API_HOST=
ENV API_CREATE_LINK=
ENV API_GET_UPLOAD_URL_LINK=
ENV API_KEY=

ADD index.js /

CMD ["npm", "start"]
