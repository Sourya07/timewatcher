import { View, Text, Button } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const signOut = () => {
    return (
        <View>
            <Text>sign-out</Text>
            <Button title="Signout" onPress={() => router.push("/sign-in")}
            />
        </View>
    )
}

export default signOut