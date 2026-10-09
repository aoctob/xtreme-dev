import 'server-only'
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

export const getPayloadClient = (): Promise<Payload> => getPayload({ config: configPromise })
