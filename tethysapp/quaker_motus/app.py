from tethys_sdk.base import TethysAppBase, url_map_maker


class QuakerMotus(TethysAppBase):
    """
    Tethys app class for Quaker Mtus.
    """

    name = 'Quaker Motus'
    index = 'quaker_motus:home'
    icon = 'quaker_motus/images/icon.png'
    package = 'quaker_motus'
    root_url = 'quaker-motus'
    color = '#16a085'
    description = 'This app calculates the ground acceleration due to earthquakes'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='quaker-motus',
                controller='quaker_motus.controllers.home'
            ),
        )

        return url_maps
