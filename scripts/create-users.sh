#!/bin/bash
while read user; do
    echo ${user}
    # FILL IN
    user_pool_id="USER_POOL_ID"
    password='Passw0rd!_'${RANDOM}

    # create the user, sending invite email
    aws cognito-idp admin-create-user \
        --user-pool-id ${user_pool_id} \
        --username ${user} \
        --user-attributes Name=email,Value=${user} Name=email_verified,Value=True \
        --temporary-password $password

    # prevent temp password expiration
    aws cognito-idp admin-set-user-password \
    --user-pool-id ${user_pool_id} \
    --username ${user} \
    --password ${password} \
    --permanent

    # create backup record in bucket
    touch ${user}
    aws s3 sync . s3://dseqr-user-backup/ --exclude '*' --include ${user}
    rm ${user}

    # prevent SES sending limits
    sleep 2
done < emails.txt

