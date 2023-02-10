import client from "./config"

const startDataBase = async(): Promise<void> => {
    await client.connect()
    console.log('Database is connected.')
}

export default startDataBase