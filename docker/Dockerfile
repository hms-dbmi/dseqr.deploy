FROM public.ecr.aws/lambda/nodejs:14
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

# working directory
ARG FUNCTION_DIR="/var/task"

RUN mkdir -p ${FUNCTION_DIR}
RUN cd ${FUNCTION_DIR}

# install cdk
ENV AWS_CDK_VERSION=1.87.1
RUN npm install -g aws-cdk@${AWS_CDK_VERSION}

RUN mkdir -p /var/task/dseqr-asg
COPY ../../dseqr-asg/ /var/task/dseqr-asg/
RUN cd dseqr-asg && \
    rm -rf node_modules package-lock.json && \
    npm install

COPY lambda/handler.js .
CMD [ "handler.run" ]
