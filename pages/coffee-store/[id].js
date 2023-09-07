"use client"
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import Head from "next/head";
import Image from "next/image";
import cls from "classnames";
import { fetchCoffeeStores } from "../../lib/coffee-stores";
import styles from "../../styles/coffee-store.module.css";
import { StoreContext } from "../../store/store-context";
import places from "../../public/static/icons/places.svg";
import nearMe from "../../public/static/icons/nearMe.svg";
import star from "../../public/static/icons/star.svg";
import { fetcher, isEmpty } from "../../utils/";
import useSWR from "swr";

export async function getStaticProps(staticProps) {
    const params = staticProps.params;
    const coffeeStores = await fetchCoffeeStores();
    const findCoffeeStoreById = coffeeStores.find((coffeeStore) => {
        return coffeeStore.id.toString() === params.id; //dynamic id
    });
    return {
        props: {
            coffeeStore: findCoffeeStoreById ? findCoffeeStoreById : {},
        },
    };
}

export async function getStaticPaths() {
    const coffeeStores = await fetchCoffeeStores();
    const paths = coffeeStores?.map((coffeeStore) => {
        return {
            params: {
                id: coffeeStore.id.toString(),
            },
        };
    });
    return {
        paths,
        fallback: true,
    };
}

const CoffeeStore = (initialProps) => {
    const router = useRouter();

    const id = router.query.id;

    const [coffeeStore, setCoffeeStore] = useState(
        initialProps.coffeeStore || {}
    );

    const {
        state: { coffeeStores },
    } = useContext(StoreContext);

    const handleCreateCoffeeStore = async (coffeeStore) => {
        try {
            const { id, name, voting, imgUrl, neighborhood, address } = coffeeStore
            const response = await fetch('/api/createCoffeeStore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    name,
                    voting: 0,
                    imgUrl,
                    neighborhood: neighborhood || "",
                    address: address || "",
                }),
            });

            const dbCoffeeStore = response.json();
        } catch (err) {
            console.error('Error creating coffee store', err)
        }
    }

    useEffect(() => {
        if (isEmpty(initialProps.coffeeStore)) {
            if (coffeeStores.length > 0) {
                const coffeeStoreFromContext = coffeeStores.find((coffeeStore) => {
                    return coffeeStore.id.toString() === id; //dynamic id
                });

                if (coffeeStoreFromContext) {
                    setCoffeeStore(coffeeStoreFromContext);
                    handleCreateCoffeeStore(coffeeStoreFromContext);
                }
            }
        } else {
            //SSG
            handleCreateCoffeeStore(initialProps.coffeeStore);
        }
    }, [id, initialProps, initialProps.coffeeStore, coffeeStores]);

    const {
        address = "",
        name = "",
        neighborhood = "",
        imgUrl = "",
    } = coffeeStore;

    const [votingCount, setVotingCount] = useState(0);

    const { data, error } = useSWR(`/api/getCoffeeStoreById?id=${id}`, fetcher);

    useEffect(() => {
        if (data && data.length > 0) {
            setCoffeeStore(data[0]);
            setVotingCount(data[0].voting);
        }

    }, [data]);

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    const handleUpVoteButton = async () => {
        try {
            const response = await fetch('/api/upVoteCoffeeStorebyId', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                }),
            });
            const dbCoffeeStore = response.json();
            if (dbCoffeeStore && dbCoffeeStore.length > 0) {
                let count = votingCount + 1;
                setVotingCount(count);
            }
        } catch (err) {
            console.error('Error upvoting the coffee store', err)
        }
    }

    if (error) {
        return <div>Something went wrong retrieving coffee store page.</div>
    }

    return (
        <div className={styles.layout}>
            <Head>
                <title>{name}</title>
            </Head>
            <div className={styles.container}>
                <div className={styles.col1}>
                    <div className={styles.backToHomeLink}>
                        <Link href="/">
                            ← Back to home
                        </Link>
                    </div>
                    <div className={styles.nameWrapper}>
                        <h1 className={styles.name}>{name}</h1>
                        <Image
                            src={
                                imgUrl ||
                                "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
                            }
                            width={600}
                            height={360}
                            className={styles.storeImg}
                            alt={name || "Coffee Store Pitcure"}>
                        </Image>
                    </div>
                </div>
                <div className={cls("glass", styles.col2)}>
                    {address && <div className={styles.iconWrapper}>
                        <Image src={places} width={24} height={24} alt="place icon" />
                        <p className={styles.text}>{address}</p>
                    </div>
                    }
                    {neighborhood && <div className={styles.iconWrapper}>
                        <Image src={nearMe} width={24} height={24} alt="nearMe icon" />
                        <p className={styles.text}>{neighborhood}</p>
                    </div>
                    }
                    <div className={styles.iconWrapper}>
                        <Image src={star} width={24} height={24} alt="star icon" />
                        <p className={styles.text}>{votingCount}</p>
                    </div>

                    <button className={styles.upVoteButton} onClick={handleUpVoteButton}>Up Vote!</button>
                </div>
            </div>
        </div>
    );
};

export default CoffeeStore;