function parseQuery(query) {
  query = query.substring(1)
  var vars = query.split('&')
  var rs = {}
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
    rs[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
  }
  return rs
}

function getPrevInfo(type) {
  return new Promise(function (resolve) {
    $.ajax({
      type: 'get',
      url: `/release/package_${type}.json`,
      dataType: 'json',
      success: function (data) {
        resolve(data)
      },
      error: function () {
        resolve(false)
      }
    })
  })
}

;(function () {
  /*登录检测*/
  var query = parseQuery(location.search)
  var createdBy = query.hostname
  var time = new Date().getTime()
  if (createdBy == null || createdBy == undefined || createdBy == '') {
    createdBy = 'Login-' + time
  }
  var postParams = {
    createdBy: createdBy,
    friendlyName: 'Login-' + time,
    ttl: 60 * 60 * 24 * 30 * 1000,
    description: 'Login-' + time,
    isSession: true
  }
  var access_token = sessionStorage.getItem('auth')
  var newAndroidVer, newIOSVer

  $.ajax({
    type: 'post',
    data: postParams,
    headers: {
      Authorization: 'Bearer ' + access_token
    },
    url: '/accessKeys',
    dataType: 'json',
    success: function () {
      getPrevInfo(type).then(function (res) {
        if (res && res.versionName) {
          var verLast = res.versionName.match(/.(?=[^.]*$).*$/)[0].replace('.',''),
            verPrev = res.versionName.replace(/.(?=[^.]*$).*$/,'')
          newAndroidVer = verPrev  + '.' + (Number(verLast) + 1)
        }
        $('#ver').val(newAndroidVer)
      })
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      if (errorThrown == 'Unauthorized') {
        alert('请重新登录!')
        location.href = '/auth/login'
      } else {
        alert(errorThrown)
        location.href = '/auth/login'
      }
    }
  })

  /*发布逻辑*/
  var packageFile,
    packageFileSize,
    type = 'Android'
  $('#file').on('change', function () {
    var file = this.files[0]
    var fileName = file.name
    var isPack = fileName.indexOf(type === 'Android' ? '.apk' : '.ipa') !== -1
    $('#callback').html(``)
    if (isPack) {
      packageFile = file
      packageFileSize = file.size
    } else alert(`仅支持${type === 'Android' ? '.apk' : '.ipa'}文件`)
  })

  $('#tab').on('click', 'a', function () {
    if (!$(this).hasClass('btn-primary')) {
      $('#callback').html(``)
      $(this).siblings().removeClass('btn-primary')
      $(this).addClass('btn-primary')
      type = this.id
      $('#packLabel').text(`上传打包 ${type === 'IOS' ? '.ipa' : '.apk'} 文件`)
      $('#upPackage').text(`立即发布${type}`)
      if (type === 'IOS') {
        if (newIOSVer) $('#ver').val(newIOSVer)
        else {
          getPrevInfo(type).then(function (res) {
            if (res && res.versionName) {
              var verLast = res.versionName.match(/.(?=[^.]*$).*$/)[0].replace('.',''),
                verPrev = res.versionName.replace(/.(?=[^.]*$).*$/,'')
              newIOSVer = verPrev  + '.' + (Number(verLast) + 1)
            }
            $('#ver').val(newIOSVer)
          })
        }
      } else {
        if (newAndroidVer) $('#ver').val(newAndroidVer)
        else {
          getPrevInfo(type).then(function (res) {
            if (res && res.versionName) {
              var verLast = res.versionName.match(/.(?=[^.]*$).*$/)[0].replace('.',''),
                verPrev = res.versionName.replace(/.(?=[^.]*$).*$/,'')
              newAndroidVer = verPrev  + '.' + (Number(verLast) + 1)
            }
            $('#ver').val(newAndroidVer)
          })
        }
      }
    }
  })

  $('#upPackage').on('click', function () {
    var data = $('#subAndroidForm').serializeArray()
    if (!packageFile) {
      alert(`请上传${type === 'Android' ? '.apk' : '.ipa'}文件`)
      return
    }
    if (!data.length || !data[0].value) {
      alert('请认真填写信息')
      return
    }
    if (!data[1].value) {
      var confirm = window.confirm('你尚未填写更新说明，确认不填了吗？不填写，将使用默认模板')
      if (!confirm) {
        $('#commit').focus()
        return
      }
    }
    var _this = this
    $(_this).attr('disabled', true).text('上传中...')
    var formData = new FormData()
    formData.append('version', data[0].value)
    formData.append('commit', data[1].value)
    formData.append('type', type)
    formData.append('file', packageFile)
    formData.append('size', packageFileSize)

    $.ajax({
      type: 'post',
      data: formData,
      contentType: false,
      processData: false,
      headers: {
        Authorization: 'Bearer ' + access_token
      },
      url: '/upgrade/package',
      success: function (data) {
        if (data && data.success) {
          $(_this).attr('disabled', false).text('立即发布')
          $('#callback').html(
            `<p style="color:green">发布成功！</p><a href="/release/package_` +
              type +
              `.json" target="_blank">json数据预览</a>`
          )
          $('#commit').val('')
          $('#ver').val('')
          $('#file').val('')
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        if (errorThrown == 'Unauthorized') {
          alert('请重新登录!')
          location.href = '/auth/login'
        } else {
          alert(errorThrown)
        }
      }
    })
  })
})()
