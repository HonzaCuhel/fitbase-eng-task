import getDatabase from '../services/_get-database.js'
import UserSchema from '../routes/user/_user.schema.js'
import ClassSchema from '../routes/class/_class.schema.js'
import MemberSchema from '../routes/member/_member.schema.js'
import TrainerSchema from '../routes/trainer/_trainer.schema.js'
import GymSchema from '../routes/gym/_gym.schema.js'

const modelDefinitions = {
  User: { name: 'User', schema: UserSchema },
  Class: { name: 'Class', schema: ClassSchema },
  Member: { name: 'Member', schema: MemberSchema },
  Trainer: { name: 'Trainer', schema: TrainerSchema },
  Gym: { name: 'Gym', schema: GymSchema },
}

export default () => async (ctx, next) => {
  const database = await getDatabase(ctx)

  for (const [key, def] of Object.entries(modelDefinitions)) {
    try {
      ctx[key] = database.model(def.name)
    }
    catch {
      ctx[key] = database.model(def.name, def.schema)
    }
  }

  await next()
}
