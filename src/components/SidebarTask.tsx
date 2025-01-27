import { RiAddCircleLine } from 'react-icons/ri'
import { GiTomato } from 'react-icons/gi'
import dayjs from 'dayjs'
import { getPageData, moveBlockToNewPage, moveBlockToSpecificBlock, navToBlock } from '@/util/logseq'
import { format } from 'date-fns'
import { ISettingsForm } from '@/util/type'
import { IEvent } from '@/util/events'
import { startPomodoro } from '@/register/pomodoro'

function getTime(task: IEvent, overdue = false) {
  const startStr = task?.addOns.start
  const endStr = task?.addOns.end

  const startDay = dayjs(startStr)
  const endDay = dayjs(endStr)
  const isSameDay = startDay.isSame(endDay, 'day')

  if (overdue) {
    if (task.addOns.allDay) {
      if (isSameDay) return ({ start: startDay.format('MM-DD') })
      return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
    } else {
      if (isSameDay && startDay.isSame(dayjs(), 'day')) return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
      if (isSameDay) return ({ start: startDay.format('MM-DD') })
      return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
    }
  }

  if (!isSameDay) return ({ start: startDay.format('MM-DD'), end: endDay.format('MM-DD') })
  if (task.addOns.allDay) return ({ start: 'all-day' })
  return ({ start: startDay.format('HH:mm'), end: endDay.format('HH:mm') })
}

const Task: React.FC<{
  task: IEvent
  type?: 'overdue' | 'allDay' | 'time'
}> = ({ task, type = 'allDay' }) => {
  const startDay = dayjs(task.addOns.start)
  const endDay = dayjs(task.addOns.end)
  const isActive = type === 'time' && dayjs().isBetween(startDay, endDay)
  const isDone = task.addOns.status === 'done'
  const calendarConfig = task.addOns.calendarConfig

  const { start, end } = getTime(task, type === 'overdue')
  const embedToToday: React.MouseEventHandler = async (e) => {
    e.stopPropagation()
    const scheduleId = task.uuid
    const { preferredDateFormat } = await logseq.App.getUserConfigs()
    const todayPage = format(dayjs().valueOf(), preferredDateFormat)
    const logKey: ISettingsForm['logKey'] = logseq.settings?.logKey
    const newBlock = await logseq.Editor.insertBlock(scheduleId, `((${scheduleId}))` + (calendarConfig?.id?.toLocaleLowerCase() === 'journal' ? '' : ` #[[${calendarConfig?.id}]]`), { before: false, sibling: true })
    if (logKey?.enabled) {
      await moveBlockToSpecificBlock(newBlock?.uuid!, todayPage, `[[${logKey?.id}]]`)
      // await createBlockToSpecificBlock(todayPage, `[[${logKey?.id}]]`, `((${scheduleId})) #[[${task.calendarId}]]`)
    } else {
      await moveBlockToNewPage(newBlock?.uuid!, todayPage)
      // await logseq.Editor.insertBlock(todayPage, `((${scheduleId})) #[[${task.calendarId}]]`)
    }
    logseq.Editor.scrollToBlockInPage(todayPage, newBlock?.uuid!)
    logseq.UI.showMsg('Embed task to today success', 'success')
  }
  const onClickStartPomodoro: React.MouseEventHandler = (e) => {
    e.stopPropagation()
    startPomodoro(task.uuid)
  }

  return (
    <div className="agenda-sidebar-task flex cursor-pointer" style={{ opacity: isDone ? 0.4 : 0.9 }} onClick={() => navToBlock(task)}>
      <div
        className="flex flex-col justify-between text-right"
        style={{
          // color: isActive ? 'var(--ls-link-text-color)' : 'var(--ls-icon-color)', fontSize: '0.8em',
          color: type === 'overdue' ? '#ed4245' : 'var(--ls-icon-color)', fontSize: '0.8em',
          width: '44px',
        }}
      >
        <div className="w-full">{start}</div>
        { end && (<div className="w-full" style={{ opacity: 0.6 }}>{end}</div>) }
      </div>
      <div style={{ width: '3px', backgroundColor: calendarConfig?.bgColor, borderRadius: '2px', margin: '0 6px' }}></div>
      <div style={{ width: 'calc(100% - 90px)', paddingBottom: '24px', position: 'relative' }}>
        <div style={{ color: 'var(--ls-icon-color)', fontSize: '0.8em', opacity: 0.6 }}>{calendarConfig?.id}</div>
        <div className="agenda-sidebar-task__title" style={{ marginBottom: '-0.2em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'absolute', bottom: 0, width: 'calc(100% - 30px)' }} title={task.addOns.showTitle}>{task.addOns.showTitle}</div>
        { isActive && <span
          className="ui__button bg-indigo-600"
          style={{ fontSize: '0.5em', position: 'absolute', right: 0, bottom: 0, padding: '0 3px', borderRadius: '3px' }}
          >NOW</span> }
      </div>

      {/* need set block id api to fixed uuid */}
      {/* <div onClick={embedToToday} className="agenda-sidebar-task__add flex" style={{ alignItems: 'center', paddingLeft: '8px' }}>
        <RiAddCircleLine style={{ color: 'var(--ls-icon-color)', fontSize: '0.9em', opacity: '0.7', marginTop: '0.2em' }} />
      </div> */}
      <div onClick={onClickStartPomodoro} className="agenda-sidebar-task__add flex" style={{ alignItems: 'center', paddingLeft: '8px' }}>
        <GiTomato style={{ color: 'var(--ls-icon-color)', fontSize: '0.9em', opacity: '0.7', marginTop: '0.2em' }} />
      </div>
    </div>
  )
}

export default Task
