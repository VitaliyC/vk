/**
 * Created by nikolay on 08.02.15.
 */
(function() {
  var group = {
    url: window.location.pathname.toString().replace('/','')
  };

  $.ajax({
    url: 'getGroupInfo',
    type: 'get',
    data: {url: group.url},
    dataType: 'json',
    success: function(data) {
      group = data;
      $('.group-logo').css('background-image', "url(" + group.imgUrl + ")");
      $('#group-name').text(group.name);
      sending();
    }
  });

  function sending() {
    $('#sendButton').on('click', function() {
      var message = $('textArea').val();
      var sendData = {
        group: group,
        message: message
      };
      $.ajax({
        url: 'message',
        type: 'post',
        data: sendData,
        dataType: 'json',
        success: function(data) {
          if(data.success) {
            $('textArea').val('');
          }
        }
      });
    })
  }
})();