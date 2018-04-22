'use strict';

module.exports = function(Coupon) {
  Coupon.allByCategory = function(cb) {
    Coupon.find({
      'include': {
        'relation': 'account',
        'scope': {
          'fields': ['id', 'name', 'category'],
        },
      },
    }).then(coupons => {
      return cb(null, coupons);
    })
    .catch(err => cb(err));
  };
  Coupon.remoteMethod(
        'allByCategory', {
          http: {
            path: '/allByCategory',
            verb: 'get',
          },
          returns: {
            arg: 'coupons',
            type: 'string',
          },
        }
      );
};
