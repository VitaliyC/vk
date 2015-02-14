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
    VK.Api.call('groups.get', {user_id: consts.userId, extended: 1, filter: 'admin, editor'}, function (r) {
      model.groups.removeAll();
      var groups = r.response;
      methods.getAddedGroups(function(userGroups) {
        if (groups.length > 1) {
          groups = groups.map(function(i) {
            if (userGroups.indexOf(i.gid) > -1) {
              i.isNew = false;
              i.old = true;
            } else {
              i.isNew = true;
              i.old = false;
            }
            return i;
          });
          for (var i = 1; i < groups.length; ++i) {
            var group = {
              id: ko.observable(groups[i].gid),
              name: ko.observable(groups[i].name),
              imgUrl: ko.observable(groups[i].photo_big),
              url: ko.observable(groups[i].screen_name),
              isNew: ko.observable(groups[i].isNew),
              old: ko.observable(groups[i].old)
            };
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
  }
};