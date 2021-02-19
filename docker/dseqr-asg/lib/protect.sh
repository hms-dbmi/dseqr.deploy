#!/bin/bash
cd /home/ubuntu/protect

if [ ! -f "instance.txt" ]; then
    INSTANCE_ID="`wget -q -O - http://169.254.169.254/latest/meta-data/instance-id`"
    ASG_NAME=`aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID"  --region us-east-2 | jq '.Tags[] | select(.["Key"] | contains("aws:autoscaling:groupName")) | .Value'`
    ASG_NAME=`echo $ASG_NAME | tr -d '"'`
    echo $ASG_NAME > asg.txt
    echo $INSTANCE_ID > instance.txt
fi


ASG_NAME=`cat asg.txt`
INSTANCE_ID=`cat instance.txt`

if docker ps | grep -q alexvpickering/dseqr
then 
    echo "protecting ${INSTANCE_ID}"
    aws autoscaling set-instance-protection --instance-ids $INSTANCE_ID --region us-east-2 --auto-scaling-group-name $ASG_NAME --protected-from-scale-in
else
    echo "de-protecting ${INSTANCE_ID}"
    aws autoscaling set-instance-protection --instance-ids $INSTANCE_ID --region us-east-2 --auto-scaling-group-name $ASG_NAME --no-protected-from-scale-in
    exit 1
fi
