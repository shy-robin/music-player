const { ipcRenderer } = require('electron')
const { $, formatTime } = require('../common/helper')
const DataStore = require('../common/dataStore')

const store = new DataStore({ name: 'musicData' })
const audio = new Audio()

let currentFile = {}
let currentClassList = null

$('#add-music-button').addEventListener('click', () => {
  ipcRenderer.send('add-music')
})

$('#music-list').addEventListener('click', (event) => {
  event.preventDefault()

  const { dataset, classList } = event.target
  const id = dataset.id // 歌曲 id
  

  if (!id) return // 如果 id 不存在，说明点击的是其他区域，直接返回
  
  if (classList.contains('icon-play')) { // 如果点击的是“播放”
    const file = store.find(id)
    if (file.id !== currentFile.id) { // 如果当前点击的是不同歌曲
      if (!audio.paused) { // 如果没有暂停，则把正在播放的歌曲暂停
        currentClassList.replace('icon-pause', 'icon-play')
      }
      currentFile = file
      audio.src = file.filePath
      currentClassList = classList // 缓存正在播放的歌曲
    }
    audio.play()
    classList.replace('icon-play', 'icon-pause') // 切换成“暂停”图标
  } else if (classList.contains('icon-pause')) { // 如果点击的是“暂停”
    audio.pause()
    classList.replace('icon-pause', 'icon-play')
  } else if (classList.contains('icon-delete-fill')) { // 如果点击的是“删除”
    if (id === currentFile.id) { // 如果删除的是当前播放歌曲
      audio.pause()
      $('#music-title').innerHTML = '暂无播放'
      $('#music-time').innerHTML = '00:00 / 00:00'
      $('#progress-bar').style.width = '0%'
    }
    store.remove(id)
    renderMusicList()
  }
})

const renderMusicList = () => {
  const list = store.getList()
  const html = list.reduce((html, item) => {
    html += `<li class="list-group-item">
    <div class="row">
      <div class="col">
        <i class="iconfont icon-yinle"></i>
      </div>
      <div class="col-9">
        ${item.fileName}
      </div>
      <div class="col">
        <i class="iconfont icon-play" data-id="${item.id}"></i>
        <i class="iconfont icon-delete-fill" data-id="${item.id}"></i>
      </div>
    </div>
    </li>`
    return html
  }, '')
  $('#music-list').innerHTML = html
}

// 当音频加载完成时，更新播放歌曲信息
audio.addEventListener('loadedmetadata', () => {
  $('#music-title').innerHTML = `正在播放：<strong>${currentFile.fileName}</strong>`
  $('#music-time').innerHTML = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
})

// 当音频播放时，每秒更新进度
audio.addEventListener('timeupdate', () => {
  $('#music-time').innerHTML = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
  $('#progress-bar').style.width = `${audio.currentTime / audio.duration * 100}%`
})

ipcRenderer.on('render-music-list', () => {
  renderMusicList()
})