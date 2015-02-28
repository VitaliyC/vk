/**
 * Created by bandalegka on 07.02.2015.
 */
$(document).ready(function () {
  VK.init({
    apiId: consts.appId
  });
  $('#getGroups').on('click', function () {
    methods.vkAuth();
  });
  $('#main').on('click', methods.goToMain);
  ko.applyBindings(model);
});

var consts = {
  appId: 4771463,
  userId: null,
  token: null
};

var methods = {
  vkAuth: function () {
    VK.Auth.login(function (response) {
      if (response.session) {
        consts.userId = response.session.user.id;
        consts.token = response.session.sid;
        methods.getUserGroups();
        methods.goToDouble();
      } else {
        /* Пользователь нажал кнопку Отмена в окне авторизации */
      }
    })
  },
  getUserGroups: function () {
    VK.Api.call('groups.get', {user_id: consts.userId, extended: 1/*, filter: 'admin, editor'*/}, function (r) {
      model.groups.removeAll();
      var groups = r.response;
      methods.getAddedGroups(function(userGroups) {
        if (groups.length > 1) {
          var i, q;
          for (i = 1; i < groups.length; ++i) {
            groups[i].isNew = true;
            groups[i].old = false;
            for (q = 0; q < userGroups.length; ++q) {
              if(userGroups[q]._id == groups[i].gid) {
                groups[i].isNew = false;
                groups[i].old = true;
                if(userGroups[q].notification) groups[i].notification = userGroups[q].notification;
                else groups[i].notification = false;
                break;
              }
            }
            var group = {
              id: ko.observable(groups[i].gid),
              name: ko.observable(groups[i].name),
              imgUrl: ko.observable(groups[i].photo_big),
              url: ko.observable(groups[i].screen_name),
              isNew: ko.observable(groups[i].isNew),
              old: ko.observable(groups[i].old),
              notification: ko.observable(groups[i].notification)
            };
            group = ko.observable(group);
            model.groups.push(group);
          }
        }
      });
    })
  },
  goToMain: function () {
    $('#page1').show();
    $('#page2').hide();
  },
  goToDouble: function () {
    $('#page1').hide();
    $('#page2').show();
  },
  getAddedGroups: function (callback) {
    $.ajax({
      url: 'getAddedGroups',
      type: 'get',
      data: {},
      dataType: 'json',
      success: callback
    })
  },
  setNotification: function (id, notification, callback) {
    $.ajax({
      url: 'setNotification',
      type: 'get',
      data: {id: id, notification: notification},
      dataType: 'json',
      success: callback
    })
  }
};

var model = {
  groups: ko.observableArray(),
  addNewGroup: function () {
    var self = this,
      req = {
        name: self.name(),
        id: self.id(),
        url: self.url(),
        imgUrl: self.imgUrl(),
        userId: consts.userId
      };
    $.ajax({
      url: 'addGroup',
      type: 'get',
      data: req,
      dataType: 'json',
      success: function (result) {
        if (result.success) {
          self.isNew(false);
          self.old(true);
        }
      }
    })
  },
  addNotify: function() {
    var self = this;
    setTimeout( function() {
        var notification = self.notification();
        var id = self.id();
        methods.setNotification(
          id,
          notification,
          function() {
            return false;
          }
        )
      }, 1000
    )
  }
};