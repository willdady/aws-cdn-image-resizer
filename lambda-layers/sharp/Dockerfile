FROM lambci/lambda:build-nodejs12.x
WORKDIR /opt/nodejs
RUN npm install sharp
WORKDIR /opt
RUN zip -r layer.zip . -x package.json
CMD true