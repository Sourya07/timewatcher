import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Fragment, useEffect } from "react";
import cn from 'clsx';
import { router, SplashScreen } from "expo-router";
import { useShopStore } from '@/Store/shopstore';
import { images, offers } from "@/constants";



export default function Index() {
  const { shops, fetchShops, loading } = useShopStore();





  useEffect(() => {
    if (shops.length === 0) {
      fetchShops();
    }
  },);


  return (


    <SafeAreaView className="flex-1 bg-white">

      <FlatList
        data={offers}
        renderItem={({ item, index }) => {
          const isEven = index % 2 === 0;

          return (
            <View>
              <Pressable
                className={cn("offer-card", isEven ? 'flex-row-reverse' : 'flex-row')}
                style={{ backgroundColor: item.color }}
                android_ripple={{ color: "#fffff22" }}
                onPress={() => {
                  console.log(item.name)
                  router.push({
                    pathname: '../Shopbyname/Shopfind',
                    params: { name: item.name },

                  });
                }}
              >
                {({ pressed }) => (
                  <Fragment>
                    <View className={"h-full w-1/2"}>
                      <Image source={item.image} className={"size-full"} resizeMode={"contain"} />
                    </View>

                    <View className={cn("offer-card__info", isEven ? 'pl-10' : 'pr-10')}>
                      <Text className="h1-bold text-white leading-tight">
                        {item.title}
                      </Text>
                      <Image
                        source={images.arrowRight}
                        className="size-10"
                        resizeMode="contain"
                        tintColor="#ffffff"
                      />
                    </View>
                  </Fragment>
                )}
              </Pressable>
            </View>
          )
        }}
        contentContainerClassName="pb-28 px-5"
        ListHeaderComponent={() => (
          <View className="flex-between flex-row w-full my-5">
            <View className="flex-start">
              <Text className="small-bold text-primary">Timeexchange</Text>
              <TouchableOpacity
                className="flex-center flex-row gap-x-1 mt-0.5"
                onPress={() => router.replace('/(authadmin)/adminsign-in')} // ✅ navigate on press
              >
                <Text className="paragraph-bold text-dark-100">Seller</Text>
                <Image source={images.arrowDown} className="size-3" resizeMode="contain" />
              </TouchableOpacity>
            </View>

            {/* <CartButton /> */}
          </View>
        )}
      />
    </SafeAreaView>
  );
}