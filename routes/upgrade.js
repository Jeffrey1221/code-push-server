var express = require('express')
var router = express.Router()
var _ = require('lodash')
var log4js = require('log4js')
var log = log4js.getLogger('cps:index')
var multer = require('multer')
var fs = require('fs')
var path = require('path')
var packageDir = path.join(__dirname, '../public/release')

let upload = multer({ dest: packageDir })

router.get('/', (req, res, next) => {
  res.render('upgrade/index', { title: '发布新版本APP' })
})

router.post('/package', upload.single('file'), (req, res) => {
  log.debug('req.body', req.body)

  let storedFileName = req.file.originalname,
    version = _.trim(req.body.version) || '',
    commit = _.trim(req.body.commit) || 'Optimized user experience',
    type = _.trim(req.body.type),
    size = _.trim(req.body.size) ? parseInt(`${Number(_.trim(req.body.size)) / 1024 / 1024}`) : 0,
    versionCode = 0

  if (type === 'IOS') storedFileName = `${new Date().getMonth() + 1}-${new Date().getDate()}_v${version}_${storedFileName}`
  let oldPath = req.file.destination + '/' + req.file.filename
  let newPath = req.file.destination + '/' + storedFileName
  fs.rename(oldPath, newPath, () => {
    const jsonPath = `${packageDir}/package_${type}.json`
    if (fs.existsSync(jsonPath)) {
      const configJson = fs.readFileSync(jsonPath,'utf-8')
      const config = JSON.parse(configJson)
      versionCode = config.versionCode + 1
    }

    const packageInfo = {
      versionCode: versionCode,
      versionName: version,
      updateContent: commit,
      downloadUrl: storedFileName,
      apkSize: size
    }
    fs.writeFileSync(jsonPath, JSON.stringify(packageInfo),'utf-8')
  })

  res.json({
    success: true
  })
})

module.exports = router
