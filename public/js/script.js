/**
 * Created by nikolay on 08.02.15.
 */
(function() {
  $(document).ready(function(){
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
  })
})();