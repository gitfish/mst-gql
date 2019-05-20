import { RootStoreBase } from "./RootStore.base"
import { messageModelPrimitives, userModelPrimitives } from "./"
import { types } from "mobx-state-tree"
import { MessageModel } from "./MessageModel"

export type RootStoreType = typeof RootStore.Type

export const RootStore = RootStoreBase.props({
  // The store itself does store Messages in loading order,
  // so we use an additional collection of references, to preserve the order as
  // it should be, regardless whether we are loading new or old messages.
  sortedMessages: types.optional(types.array(types.reference(MessageModel)), [])
})
  .views(self => ({
    get me() {
      return self.users.get("mweststrate")
    }
  }))
  .actions(self => ({
    afterCreate() {
      self.subscribeNewMessages(
        {},
        `${messageModelPrimitives} user { ${userModelPrimitives} } `,
        message => {
          self.sortedMessages.unshift(message)
        }
      )
    },
    loadMessages(offset, count) {
      const query = self.queryMessages(
        { offset, count },
        `${messageModelPrimitives} user { ${userModelPrimitives} } `
      )
      query.then(data => {
        self.sortedMessages.push(...data)
      })
      return query
    }
  }))
  .actions(self => ({
    sendTweet(text, replyTo = "") {
      return self.mutatePostTweet({ text, user: self.me.id, replyTo })
    },
    loadInitialMessages() {
      return self.loadMessages("", 3)
    },
    loadMore() {
      const lastMessage = self.sortedMessages[self.sortedMessages.length - 1]
      return self.loadMessages(lastMessage.id, 2)
    }
  }))