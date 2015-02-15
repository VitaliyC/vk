/**
 * Created by nikolay on 08.02.15.
 */
(function() {
  $(document).ready(function(){
    var sendData = {};
    $('#sendButton').on('click', function() {
      var message = $('textArea').val();
      sendData.group = group;
      sendData.message = message;
      $.ajax({
        url: 'message',
        type: 'post',
        data: sendData,
        dataType: 'json',
        success: function(data) {
          if(data.success) {
            $('.main-container').hide();
            $('.success-block').show();
          }
        }
      });
    });

    $('#inpFile').on('change', function() {
      $('#uploadForm').ajaxSubmit({
        error: function(xhr) {
          console.log('Error: ' + xhr.status);
        },
        success: function(response) {
          if(response.filePath) {
            $('#appendImg').empty().append(
             "<a href='" + response.filePath + "' target='_blank'>" + "<img src='"+ response.filePath +"'>" + "</a>"
            );
            sendData.img = response.name;
          }
        }
      });
      //Very important line, it disable the page refresh.
      return false;
    });

    $('#attach').click(function() {
      $('#inpFile').trigger('click');
    })
  })
})();