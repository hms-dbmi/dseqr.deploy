FROM public.ecr.aws/lambda/nodejs:16
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

# working directory
ARG FUNCTION_DIR="/var/task"

RUN mkdir -p ${FUNCTION_DIR}
RUN cd ${FUNCTION_DIR}

# install cdk
ENV AWS_CDK_VERSION=2.84.0
ENV YARN_VERSION=1.22.19
RUN npm install -g aws-cdk@${AWS_CDK_VERSION}
RUN npm install -g yarn@${YARN_VERSION}

RUN mkdir -p /var/task/dseqr-asg
COPY dseqr-asg/ /var/task/dseqr-asg/
RUN cd dseqr-asg && \
    yarn install

RUN cd /var/task/dseqr-asg/lambda && \
    yarn install && \
    cd ..

COPY lambda/handler.js .
CMD [ "handler.run" ]
