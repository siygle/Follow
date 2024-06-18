import {
  Collapsible,
  CollapsibleTrigger,
} from "@renderer/components/ui/collapsible"
import { levels } from "@renderer/lib/constants"
import { showNativeMenu } from "@renderer/lib/native-menu"
import { cn } from "@renderer/lib/utils"
import type { FeedListModel } from "@renderer/models"
import {
  feedActions,
  useFeedActiveList,
  useUnreadStore,
} from "@renderer/store"
import { AnimatePresence, m } from "framer-motion"
import { useEffect, useState } from "react"

import { useModalStack } from "../../components/ui/modal/stacked/hooks"
import { CategoryRemoveDialogContent } from "./category-remove-dialog"
import {
  CategoryRenameContent,
} from "./category-rename-dialog"
import { FeedItem } from "./item"

const { setActiveList } = feedActions

export function FeedCategory({
  data,
  view,
  expansion,
}: {
  data: FeedListModel["list"][number]
  view?: number
  expansion: boolean
}) {
  const activeList = useFeedActiveList()

  const [open, setOpen] = useState(!data.name)

  const feedIdList = data.list.map((feed) => feed.feedId)

  useEffect(() => {
    if (data.name) {
      setOpen(expansion)
    }
  }, [expansion])

  const setCategoryActive = () => {
    if (view !== undefined) {
      setActiveList({
        level: levels.folder,
        id: data.list.map((feed) => feed.feedId).join(","),
        name: data.name,
        view,
      })
    }
  }

  const unread = useUnreadStore((state) =>
    data.list.reduce((acc, cur) => (state.data[cur.feedId] || 0) + acc, 0),
  )

  const sortByUnreadFeedList = useUnreadStore((state) =>
    data.list.sort(
      (a, b) => (state.data[b.feedId] || 0) - (state.data[a.feedId] || 0),
    ),
  )
  const { present } = useModalStack()
  return (
    <Collapsible
      open={open}
      onOpenChange={(o) => setOpen(o)}
      onClick={(e) => e.stopPropagation()}
    >
      {!!data.name && (
        <div
          className={cn(
            "flex w-full items-center justify-between rounded-md px-2.5 transition-colors",
            activeList?.level === levels.folder &&
            activeList.name === data.name &&
            "bg-native-active",
          )}
          onClick={(e) => {
            e.stopPropagation()
            setCategoryActive()
          }}
          onContextMenu={(e) => {
            showNativeMenu(
              [
                {
                  type: "text",
                  label: "Rename Category",
                  click: () => {
                    present({
                      title: "Rename Category",
                      content: ({ dismiss }) => (
                        <CategoryRenameContent
                          feedIdList={feedIdList}
                          category={data.name}
                          view={view}
                          onSuccess={dismiss}
                        />
                      ),
                    })
                  },
                },
                {
                  type: "text",
                  label: "Delete Category",

                  click: async () => {
                    present({
                      title: `Delete category ${data.name}?`,
                      content: () => (
                        <CategoryRemoveDialogContent feedIdList={feedIdList} />
                      ),
                    })
                  },
                },
              ],
              e,
            )
          }}
        >
          <div className="flex w-full min-w-0 items-center">
            <CollapsibleTrigger
              className={cn(
                "flex h-8 items-center [&_.i-mgc-right-cute-fi]:data-[state=open]:rotate-90",
                !setActiveList && "flex-1",
              )}
            >
              <i className="i-mgc-right-cute-fi mr-2 transition-transform" />
              {!setActiveList && <span className="truncate">{data.name}</span>}
            </CollapsibleTrigger>
            {!!setActiveList && <span className="truncate">{data.name}</span>}
          </div>
          {!!unread && (
            <div className="ml-2 text-xs text-zinc-500">{unread}</div>
          )}
        </div>
      )}
      <AnimatePresence>
        {open && (
          <m.div
            className="overflow-hidden"
            initial={!!data.name && {
              height: 0,
              opacity: 0.01,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0.01,
            }}
          >
            {sortByUnreadFeedList.map((feed) => (
              <FeedItem
                key={feed.feedId}
                feed={feed}
                view={view}
                className={data.name ? "pl-6" : "pl-2.5"}
              />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}
