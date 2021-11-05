import React from "react";
import { gql, useQuery } from "@apollo/client";
import { 
    FeaturedContentSidebarRssProps
} from "../../types";
import SidebarWrapper from "./wrapper";

export interface RssItemsData {
    RssItems: RssItem[]
}
export interface RssItem {
    title: string;
    link: string;
}

export interface RssItemsVars {
    feedUrl: string;
}

export const RSS_ITEMS_QUERY = gql`
    query RssItemsQuery(
        $feedUrl: String!
    ) {
        RssItems(
            feedUrl: $feedUrl
        ) {
            title
            link
        }
    }
`

const SidebarRss = ({ title, feedUrl }: FeaturedContentSidebarRssProps): JSX.Element => {
    const { data, loading, error } = useQuery<RssItemsData, RssItemsVars>(RSS_ITEMS_QUERY, { variables: { feedUrl } });
    let content;
    if (loading) {
        content = <h5>Please Wait...</h5>
    } else if (error) {
        content = <h5>We are having trouble loading your RSS items.</h5>
    } else {
        content = (
            <>
                {data && data.RssItems.map(({ title, link }, index) => (
                    <a key={index} href={link} className="block mb-4">
                        {title}
                    </a>
                ))}
            </>
        )
    }

    return (
        <SidebarWrapper title={title}>
            {content}
        </SidebarWrapper>
    )
};

SidebarRss.displayName = "SidebarRss";

export default SidebarRss;
