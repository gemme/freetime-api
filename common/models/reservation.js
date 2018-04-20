'use strict';
var QRCode = require('qrcode');
const fs = require('fs');
var path = require('path');

module.exports = function(Reservation) {
  Reservation.generateQR = cb => {
    QRCode.toFile('server/qrs/fileCarlos.png', 'Some text!!', {
      color: {
        dark: '#00F',  // Blue dots
        light: '#0000', // Transparent background
      },
    }, err => {
      if (err) return cb(err);
      console.log('Reservation.app.models.Media.uploadStream');
      console.log(Reservation.app.models.Media.uploadStream);
      console.log('__dirname', __dirname);
      var writer = Reservation.app.models.Media.uploadStream('my-itexico-intranet', 'fileCarlos.png');
      // path.join(__dirname, 'server/qrs/filename.png')
      fs.createReadStream('server/qrs/fileCarlos.png').pipe(writer);
      writer.on('finish', () => {
        return cb(null, 'successfully created');
      });
      writer.on('error', err =>{
        return cb('errorrr', err);
      });
    });

    /* Reservation.find({
      'include': {
        'relation': 'account',
        'scope': {
          'fields': ['category', 'id'],
        },
      },
    }).then(coupons => {
      return cb(null, coupons);
    })
    .catch(err => cb(err)); */
  };
  Reservation.remoteMethod(
        'generateQR', {
          http: {
            path: '/generateQR',
            verb: 'get',
          },
          returns: {
            arg: 'success',
            type: 'string',
          },
        }
      );

  /**
   * Once the reservation is created
   * the backend generates a qr image
   * and it is uploaded to s3 bucket amazon
   */
  // path.join(__dirname, 'server/qrs/filename.png')
  Reservation.observe('after save', (ctx, next) => {
    // validate is a new instance
    if (!ctx.isNewInstance) return next();
    if (!ctx.instance) return next();
    // filename, path, container
    var fileName = `${ctx.instance.id}.png`;
    var _path = `server/qrs/${fileName}`;
    var container = 'my-itexico-intranet';
    var containerURL = `https://my-itexico-intranet.s3.us-west-2.amazonaws.com/${fileName}`;
    var Media = Reservation.app.models.Media;
    // generate the QR image
    QRCode.toFile(_path, fileName, {
      color: {
        dark: '#00F',  // Blue dots
        light: '#0000', // Transparent background
      },
    })
    // upload the file
    .then(result => Media.uploadStream(container, fileName))
    // create the stream and update url
    .then(writer => {
      fs.createReadStream(_path).pipe(writer);
      writer.on('finish', () => {
        ctx.instance.updateAttributes({
          id: ctx.instance.id,
          media_urls: [containerURL],
        })
        // response the object with the url updated
        // TODO: once the file is uploaded
        // delete the file
        .then(reservation => next(null, reservation));
      });
      writer.on('error', err =>{
        return next(err);
      });
    })
    .catch(err => next(err));
  });
};
