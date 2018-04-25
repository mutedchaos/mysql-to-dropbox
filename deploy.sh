#!/bin/bash
if ! git remote -v | grep mutedchaos
then
        git remote add mutedchaos tapani.haka@mutedchaos.com:backbonebackup
fi
git push mutedchaos master
ssh mutedchaos.com "cd backbonebackup && git reset --hard master && npm install --production"
