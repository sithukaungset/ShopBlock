/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class VideoStreaming extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const videos = [
            {
                userID: 'XR Edge Chain',
                title: 'Default',
                chunk_size: 'Default',
                resolution: 'Default',
                date: 'Default',
                hit: 'Default',
            },


        ];

        for (let i = 0; i < videos.length; i++) {
            videos[i].docType = 'video';
            await ctx.stub.putState('Chunk' + i, Buffer.from(JSON.stringify(videos[i])),null,2);
            console.info('Added <--> ', videos[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryVideo(ctx, videoNumber) {
        const videoAsBytes = await ctx.stub.getState(videoNumber); // get the car from chaincode state
        if (!videoAsBytes || videoAsBytes.length === 0) {
            throw new Error(`${videoNumber} does not exist`);
        }
        console.log(videoAsBytes.toString());
        return videoAsBytes.toString();
    }

    async createVideo(ctx, videoNumber, userID, title, chunk_size, resolution, date, hit) {
        console.info('============= START : Inserting video chunk ===========');

        const video = {
            userID,
            title,
            chunk_size,
            resolution,
            date,
            hit,

        };

        await ctx.stub.putState(videoNumber, Buffer.from(JSON.stringify(video)));
        console.info('============= END : Inserting video chunk ===========');
    }

    async queryAllVideos(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changeHit(ctx, videoNumber, newHit) {
        console.info('============= START : change Hit ===========');

        const videoAsBytes = await ctx.stub.getState(videoNumber); // get the video chunk from chaincode state
        if (!videoAsBytes || videoAsBytes.length === 0) {
            throw new Error(`${videoNumber} does not exist`);
        }
        const video = JSON.parse(videoAsBytes.toString());
        video.hit = newHit;

        await ctx.stub.putState(videoNumber, Buffer.from(JSON.stringify(video)));
        console.info('============= END : change Hit ===========');
    }

}

module.exports = VideoStreaming;
